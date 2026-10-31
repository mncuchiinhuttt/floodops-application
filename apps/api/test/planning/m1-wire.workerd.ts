import { afterEach, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { formatEtag, parseSchema } from "@floodops/contracts";
import type { PlanningJob } from "@floodops/contracts";
import { validateOperations } from "@floodops/domain/operations";
import { simulationPersistence } from "../../src/index";
import { create, get, post, run, mutate, snapshot, key, rpc } from "./runtime-fixtures";
import { PLAN_START, PLAN_BEGIN, PLAN_COMPLETE } from "../../src/features/planning/index";
import type { PlanningReservation } from "../../src/features/planning/index";
afterEach(reset);
async function terminal(f: Awaited<ReturnType<typeof create>>, id: string): Promise<PlanningJob> {
  for (let i = 0; i < 100; i++) {
    const job = parseSchema("PlanningJobResponse", await (await get(f, "/planning-jobs/" + id)).json()).data!;
    if (!["queued", "running"].includes(job.status)) return job;
  }
  throw new Error("M1 job did not finish");
}
async function start(f: Awaited<ReturnType<typeof create>>) {
  const response = await post(f, "/planning-jobs", { cause: "manual", cause_entity_ids: [] });
  expect(response.status).toBe(202);
  const raw = await response.json(), job = parseSchema("PlanningJobResponse", raw).data!;
  expect(job.planner).toMatchObject({ kind: "deterministic", algorithm_version: "deterministic-bounded-v1", search_limit: 16 });
  expect(job.planner.config_hash).toMatch(/^[a-f0-9]{64}$/);
  expect("model" in job).toBe(false); expect("model_config_hash" in job).toBe(false);
  return job;
}
it("bounded no-feasible result is failed/nullplan and publishes no empty proposal or operational effects", async () => {
  const f = await create();
  await mutate(f, s => {
    const current = structuredClone(simulationPersistence.read(s.values));
    for (const o of current.sourceSnapshot.observations) o.condition = "impassable";
    s.values = simulationPersistence.write(s.values, current); s.meta.revision++;
  });
  f.etag = formatEtag((await snapshot(f)).meta);
  const before = await run(f), reserved = await start(f), job = await terminal(f, reserved.job_id);
  expect(job).toMatchObject({ status: "failed", plan_id: null, error_code: "NO_FEASIBLE_PLAN" });
  expect(job.completed_at).not.toBeNull(); expect(job.planner).toEqual(reserved.planner);
  const after = await snapshot(f);
  expect(after.meta.revision).toBe(1); expect(after.pointers.latest_plan_id).toBeNull();
  expect(parseSchema("PlanListResponse", await (await get(f, "/plans")).json()).data!.items).toHaveLength(0);
  expect((await run(f)).branches).toEqual(before.branches);
});
it("no-change is a completed immutable empty plan and never a no-feasible failure", async () => {
  const f = await create();
  await mutate(f, s => {
    const current = structuredClone(simulationPersistence.read(s.values)), ops = current.branches.floodops!.operations;
    current.branches.floodops!.operations = { ...ops, orders: ops.orders.map(o => ({ ...o, lifecycle: "delivered",
      driver_id: o.driver_id ?? "drv_moto01", delivered_at_minute: 0 })), drivers: ops.drivers.map(d => ({ ...d, ordered_stops: [] })),
      hubs: ops.hubs.map(h => ({ ...h, available_order_ids: [] })) };
    validateOperations(current.branches.floodops!.operations);
    s.values = simulationPersistence.write(s.values, current); s.meta.revision++;
  });
  f.etag = formatEtag((await snapshot(f)).meta);
  const before = await run(f), reserved = await start(f), job = await terminal(f, reserved.job_id);
  expect(job.status).toBe("completed"); expect(job.error_code).toBeNull(); expect(job.plan_id).not.toBeNull();
  const plan = parseSchema("PlanResponse", await (await get(f, "/plans/" + job.plan_id)).json()).data!;
  expect(plan.actions).toHaveLength(0); expect(plan.route_ids).toHaveLength(0);
  expect((await snapshot(f)).meta.revision).toBe(1); expect((await run(f)).branches).toEqual(before.branches);
});
it("explicit planner deadline completion uses PLANNER_TIMEOUT and rejects photo MODEL_TIMEOUT", async () => {
  const f = await create(), before = await run(f);
  const reply = await rpc(f, { kind: "command", name: PLAN_START, key: key(), payload: { input: { cause: "manual", cause_entity_ids: [] }, etag: f.etag } });
  expect(reply.status).toBe(200);
  const material = (reply.body.data as PlanningReservation).execution!;
  const authority = { job_id: material.jobId, lease_id: material.leaseId, nonce: material.nonce, attempt_id: "attempt_timeout1" };
  const fence = { lease_id: material.leaseId, nonce: material.nonce };
  expect((await rpc(f, { kind: "command", name: PLAN_BEGIN, key: key(), payload: authority, fence })).status).toBe(200);
  expect((await rpc(f, { kind: "command", name: PLAN_COMPLETE, key: key(), payload: { ...authority, error_code: "MODEL_TIMEOUT" }, fence })).status).toBe(422);
  const done = await rpc(f, { kind: "command", name: PLAN_COMPLETE, key: key(), payload: { ...authority, error_code: "PLANNER_TIMEOUT" }, fence });
  expect(done.status).toBe(200);
  expect(parseSchema("PlanningJob", done.body.data)).toMatchObject({ status: "failed", plan_id: null, error_code: "PLANNER_TIMEOUT" });
  expect((await run(f)).branches).toEqual(before.branches); expect((await snapshot(f)).meta.revision).toBe(0);
});
it("old/missing serialization is refused on uncached planning without rewriting old values", async () => {
  const f = await create();
  await mutate(f, s => { s.values.runtime_contract = { serialization: "legacy-v1", version: "0.3" }; });
  const before = await snapshot(f);
  expect((await post(f, "/planning-jobs", { cause: "manual", cause_entity_ids: [] })).status).toBe(409);
  expect((await get(f, "/plans")).status).toBe(409);
  expect((await snapshot(f)).values).toEqual(before.values);
});
