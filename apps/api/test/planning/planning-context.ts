import type { Approval, Objective, Plan, PlanAction, Route, Stop } from "@floodops/contracts";
import { computeRoute, createRun, loadScenario, sealScenarioDraft } from "@floodops/simulation";
import type { ScenarioManifest, SimulationCandidate, SimulationRun } from "@floodops/simulation";
import type { PlanningAuthority } from "../../../../packages/domain/src/planning/index.ts";
const manifest = await Bun.file(new URL("../../../../data/scenarios/functional-v1/manifest.json", import.meta.url)).json() as ScenarioManifest;
export const hash = (value: string) => new Bun.CryptoHasher("sha256").update(value).digest("hex");
export const highOnly = { authorizeEntry: ({ knowledge }: { knowledge: SimulationRun["knowledge"][number] | null }) =>
  ({ allowed: knowledge?.state === "known" && knowledge.confidence_band === "high", reason: "TEST_HIGH_ONLY" }) };
export const moto = "drv_moto01", car = "drv_auto01", critical = "ord_order1", food = "ord_order2", standard = "ord_order3";
export function runFixture(events = false): SimulationRun {
  const data = structuredClone(manifest); if (!events) data.events = [];
  return structuredClone(createRun(loadScenario(sealScenarioDraft(data, hash), hash), "run_planning1"));
}
const zero: Objective = { critical_unreachable: 0, critical_late: 0, critical_delay_minute: 0,
  food_late: 0, total_late: 0, total_delay_minute: 0, total_unreachable: 0 };
export function makeAction(id = "act_route001", group = "grp_route001", driver = moto): PlanAction {
  return { action_id: id, dependency_group_id: group, depends_on_action_ids: [], kind: "reroute",
    targets: { order_id: null, driver_id: driver, hub_id: null, route_id: "rte_route001", defer_minute: null },
    reason: "Synthetic policy test", evidence_ids: [], rule_results: [], status: "ready" };
}
export function makePlan(actions: PlanAction[] = [makeAction()]): Plan {
  return { plan_id: "pln_fixture1", session_id: "ses_fixture1", generation: 0, input_revision: 0,
    planning_job_id: "job_fixture1", status: "ready", actions,
    groups: [...new Set(actions.map(a => a.dependency_group_id))].map(id => ({ group_id: id,
      action_ids: actions.filter(a => a.dependency_group_id === id).map(a => a.action_id), depends_on_group_ids: [] })),
    route_ids: [...new Set(actions.map(a => a.targets.route_id).filter((id): id is string => id !== null))],
    objective_before: zero, objective_after: zero, diff: [], is_projected: true };
}
export function authority(run: SimulationRun, plan = makePlan()): PlanningAuthority {
  return { identity: { session_id: plan.session_id, generation: plan.generation, input_revision: plan.input_revision,
    plan_id: plan.plan_id, planning_job_id: plan.planning_job_id },
    current: { session_id: plan.session_id, generation: plan.generation, revision: plan.input_revision,
      latest_plan_id: plan.plan_id, latest_requested_job_id: plan.planning_job_id },
    approvals: [], epochs: run.scenario.manifest.graph.segments.flatMap(segment => segment.allowed_vehicle_types.map(vehicle => ({
      segment_id: segment.segment_id, vehicle_type: vehicle,
      knowledge_epoch: run.knowledge.find(k => k.segment_id === segment.segment_id && k.vehicle_type === vehicle)?.knowledge_epoch ?? 0 }))) };
}
export function approval(plan = makePlan(), actionId = plan.actions[0]!.action_id, decision: Approval["decision"] = "approve"): Approval {
  return { approval_id: "apr_fixture1", plan_id: plan.plan_id, action_id: actionId, input_revision: plan.input_revision,
    decision, participant_id: "par_dispatch1", reason: "Explicit human test decision", created_at: "2026-10-31T00:00:00Z" };
}
export function makeRoute(run: SimulationRun, driver = moto, candidate?: SimulationCandidate, routeId = "rte_route001"): Route {
  return computeRoute(run, candidate ?? { assignments: [], stopsByDriver: {
    [driver]: run.branches.floodops!.operations.drivers.find(d => d.driver_id === driver)!.ordered_stops } },
  driver, highOnly, { routeId, inputRevision: 0, hash });
}
export function stopsFor(run: SimulationRun, orderId: string, hubId?: string): Stop[] {
  const order = run.branches.floodops!.operations.orders.find(o => o.order_id === orderId)!;
  const hub = run.branches.floodops!.operations.hubs.find(h => h.hub_id === (hubId ?? order.pickup_hub_id))!;
  const service = run.scenario.manifest.config.parameters.find(p => p.key === `pickup_service:${orderId}:${hub.hub_id}`)!.value!;
  return [{ stop_id: `stp_pickup_${orderId}`, order_id: orderId, kind: "pickup", node_id: hub.node_id, service_minute: service },
    { stop_id: `stp_deliver_${orderId}`, order_id: orderId, kind: "delivery", node_id: order.destination_node_id, service_minute: order.service_minute }];
}
