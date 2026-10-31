import { parseSchema } from "@floodops/contracts";
import { createPlanningServices, PLAN_START, PLAN_BEGIN, PLAN_COMPLETE } from "../../src/features/planning/index";
import type { PlanningReservation } from "../../src/features/planning/index";
import type { TransitionContext } from "../../src/shared/index";
import { simulationPersistence } from "../../src/index";
import { rpc, key } from "./runtime-fixtures";
import type { Fixture } from "./runtime-fixtures";
/** Explicit server-computed soft candidate for approval-gate regression, independent of search choice. */
export async function motoPlan(f: Fixture) {
  const reserved = await rpc(f, { kind: "command", name: PLAN_START, key: key(), path: "/planning-reserve",
    payload: { input: { cause: "manual", cause_entity_ids: [] }, etag: f.etag } });
  if (reserved.status !== 200) throw new Error("Soft reserve failed:" + reserved.status);
  const material = (reserved.body.data as PlanningReservation).execution!;
  const authority = { job_id: material.jobId, lease_id: material.leaseId, nonce: material.nonce, attempt_id: "attempt_soft001" };
  const fence = { lease_id: material.leaseId, nonce: material.nonce };
  const expectedPointers = { latest_requested_job_id: material.jobId };
  const begun = await rpc(f, { kind: "command", name: PLAN_BEGIN, key: key(), payload: authority, fence, expectedPointers });
  if (begun.status !== 200) throw new Error("Soft begin failed:" + begun.status);
  const captured = begun.body.data as { context: TransitionContext; planId: string };
  const services = createPlanningServices(captured.context, simulationPersistence.read(captured.context.snapshot.values),
    material.jobId, captured.planId, { persistence: simulationPersistence });
  const route = await services.computeRoute({ driver_id: "drv_moto01", origin_node_id: "node_hubAAA",
    stop_refs: [{ order_id: "ord_order1", kind: "pickup" }, { order_id: "ord_order1", kind: "delivery" }], assignment_overrides: [] });
  const proposal = services.finalize({ action_ids: [], route_ids: [route.route_id] });
  const completed = await rpc(f, { kind: "command", name: PLAN_COMPLETE, key: key(), payload: { ...authority, proposal }, fence, expectedPointers });
  if (completed.status !== 200) throw new Error("Soft completion failed:" + completed.status);
  return parseSchema("Plan", proposal.plan);
}
export async function softPlan(f: Fixture) {
  const plan = await motoPlan(f);
  if (plan.status !== "pending_approval") throw new Error("Soft route must require explicit approval.");
  return plan;
}
