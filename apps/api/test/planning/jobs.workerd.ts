import { afterEach, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import type { PlanAction, Route } from "@floodops/contracts";
import type { TransitionContext } from "../../src/shared/index";
import { PLAN_START, PLAN_BEGIN, PLAN_COMPLETE } from "../../src/features/planning/index";
import type { PlanningReservation } from "../../src/features/planning/index";
import { createToolSession } from "../../src/features/planning/tool-session";
import { simulationPersistence } from "../../src/index";
import { create, rpc, snapshot, run, mutate, get, post, key, request, auth } from "./runtime-fixtures";
afterEach(reset);
async function reserve(f: Awaited<ReturnType<typeof create>>) {
  return rpc(f, { kind: "command", name: PLAN_START, key: key(), path: "/planning-reserve",
    payload: { input: { cause: "manual", cause_entity_ids: [] }, etag: f.etag } });
}
it("coalescing, cancellation and expired planning lease never create operations or a late proposal", async () => {
  const f = await create(), before = await run(f), first = await reserve(f);
  expect(first.status).toBe(200);
  const reservation = first.body.data as PlanningReservation, material = reservation.execution!;
  const coalesced = await reserve(f);
  expect((coalesced.body.data as PlanningReservation).execution).toBeNull();
  expect((coalesced.body.data as PlanningReservation).job.job_id).toBe(reservation.job.job_id);
  const cancelled = await request("/sessions/" + f.id + "/planning-jobs/" + material.jobId + "/cancellations",
    { method: "POST", headers: auth(f, { "Idempotency-Key": key() }) });
  expect(cancelled.status).toBe(200); expect(parseSchema("PlanningJobResponse", await cancelled.json()).data?.status).toBe("cancelled");
  const authority = { job_id: material.jobId, lease_id: material.leaseId, nonce: material.nonce, attempt_id: "attempt_cancel1" };
  expect((await rpc(f, { kind: "command", name: PLAN_BEGIN, key: key(), payload: authority })).status).toBe(409);
  const next = (await reserve(f)).body.data as PlanningReservation;
  await mutate(f, s => { s.leases[next.execution!.leaseId]!.expires_at = Date.now() - 1; });
  const job = await get(f, "/planning-jobs/" + next.job.job_id);
  expect(parseSchema("PlanningJobResponse", await job.json()).data).toMatchObject({ status: "failed", error_code: "MODEL_TIMEOUT" });
  expect((await snapshot(f)).meta.revision).toBe(0); expect((await run(f)).branches).toEqual(before.branches);
});
it("P1 hub change uses actual tools/DO Execute and runner pickup at the new hub without changing SLA", async () => {
  const f = await create(), reservation = (await reserve(f)).body.data as PlanningReservation, material = reservation.execution!;
  const authority = { job_id: material.jobId, lease_id: material.leaseId, nonce: material.nonce, attempt_id: "attempt_hub0001" };
  const begun = await rpc(f, { kind: "command", name: PLAN_BEGIN, key: key(), payload: authority,
    fence: { lease_id: material.leaseId, nonce: material.nonce }, expectedPointers: { latest_requested_job_id: material.jobId } });
  expect(begun.status).toBe(200);
  const captured = begun.body.data as { context: TransitionContext; planId: string };
  const capturedRun = simulationPersistence.read(captured.context.snapshot.values);
  const tools = createToolSession(captured.context, capturedRun, material.jobId, captured.planId, { persistence: simulationPersistence });
  const route = await tools.execute("compute_route", { driver_id: "drv_auto01", origin_node_id: "node_hubBBB",
    stop_refs: [{ order_id: "ord_order2", kind: "pickup" }, { order_id: "ord_order2", kind: "delivery" },
      { order_id: "ord_order3", kind: "pickup" }, { order_id: "ord_order3", kind: "delivery" }],
    assignment_overrides: [{ order_id: "ord_order3", driver_id: "drv_auto01", pickup_hub_id: "hub_beta01" }] }) as Route;
  const action = await tools.execute("propose_assignment_change", { order_id: "ord_order3", driver_id: "drv_auto01",
    pickup_hub_id: "hub_beta01", route_id: route.route_id, reason: "Explicit proposed new hub",
    evidence_ids: [route.evidence_ids[0]!] }) as PlanAction;
  const bundle = tools.finalize({ action_ids: [action.action_id], route_ids: [] });
  const completed = await rpc(f, { kind: "command", name: PLAN_COMPLETE, key: key(), payload: { ...authority, proposal: bundle },
    fence: { lease_id: material.leaseId, nonce: material.nonce }, expectedPointers: { latest_requested_job_id: material.jobId } });
  expect(completed.status).toBe(200);
  expect((await post(f, "/plans/" + bundle.plan.plan_id + "/decisions", {
    action_ids: bundle.plan.actions.map(a => a.action_id), decision: "approve", reason: "Dispatcher approves exact actions" })).status).toBe(200);
  const execution = await post(f, "/plans/" + bundle.plan.plan_id + "/executions", { group_ids: bundle.plan.groups.map(g => g.group_id) });
  expect(execution.status).toBe(201);
  const current = await run(f), order = current.branches.floodops!.operations.orders.find(o => o.order_id === "ord_order3")!;
  expect(order.pickup_hub_id).toBe("hub_beta01"); expect(order.original_sla_minute).toBe(12);
  const advance = await post(f, "/simulation/advances", { target_sim_minute: 11 }, key(), '"s:' + f.id + ':g:0:r:1"');
  expect(advance.status).toBe(202);
  for (let i = 0; i < 80 && (await snapshot(f)).meta.status === "advancing"; i++) await get(f, "/simulation");
  const moved = await run(f);
  expect(moved.pickupUsage.floodops!.find(p => p.orderId === "ord_order3")?.hubId).toBe("hub_beta01");
  expect(moved.branches.floodops!.operations.orders.find(o => o.order_id === "ord_order3")!.delivered_at_minute).not.toBeNull();
  expect(moved.branches.static!.operations.orders.find(o => o.order_id === "ord_order3")!.driver_id).toBeNull();
});

it("accepted conflict facts block proposed Execute even when cached run knowledge still says high", async () => {
  const f = await create();
  await mutate(f, snapshot => {
    const current = structuredClone(simulationPersistence.read(snapshot.values));
    const originals = current.sourceSnapshot.observations.filter(o => o.validation === "accepted"
      && o.observed_sim_minute <= current.nowMs / 60000 && o.vehicle_types.includes("motorbike"));
    current.sourceSnapshot.observations.push(...originals.map((o, index) => ({ ...o,
      observation_id: "obs_contrary_" + index + "000000", condition: o.condition === "impassable" ? "normal" as const : "impassable" as const })));
    snapshot.values = simulationPersistence.write(snapshot.values, current); snapshot.meta.revision++;
  });
  f.etag = '"s:' + f.id + ':g:0:r:1"';
  const before = await run(f), response = await post(f, "/planning-jobs", { cause: "manual", cause_entity_ids: [] });
  expect(response.status).toBe(202);
  const job = parseSchema("PlanningJobResponse", await response.json()).data!;
  let proposalId: string | null = null;
  for (let i = 0; i < 80 && !proposalId; i++) proposalId = parseSchema("PlanningJobResponse", await (await get(f, "/planning-jobs/" + job.job_id)).json()).data!.plan_id;
  expect(proposalId).not.toBeNull();
  const proposal = parseSchema("PlanResponse", await (await get(f, "/plans/" + proposalId)).json()).data!;
  expect(proposal.status).toBe("blocked");
  await post(f, "/plans/" + proposal.plan_id + "/decisions", { action_ids: proposal.actions.map(a => a.action_id), decision: "approve", reason: "Cannot override conflict" });
  const denied = await post(f, "/plans/" + proposal.plan_id + "/executions", { group_ids: proposal.groups.map(g => g.group_id) });
  expect(denied.status).toBe(422); expect((await run(f)).branches).toEqual(before.branches);
  expect((await snapshot(f)).meta.revision).toBe(1);
});
