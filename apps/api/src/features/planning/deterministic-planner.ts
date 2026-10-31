import { compareObjectives, projectCurrent } from "@floodops/simulation";
import type { SimulationRun } from "@floodops/simulation";
import type { TransitionContext } from "../../shared/index";
import { PlatformError } from "../../shared/index";
import { OperationError } from "@floodops/domain/operations";
import { createCommittedMovementPolicy } from "./committed-policy";
import { createPlanningServices } from "./internal-services";
import { normalizePlanningRun } from "./runtime-context";
import { searchCandidates } from "./search-candidates";
import { PLANNER_VERSION, PlanningSearchStopped, searchLimits } from "./deterministic-types";
import type { CandidateSpec, DeterministicProposal, SearchLimits } from "./deterministic-types";
import type { PlanningRuntimeOptions } from "./runtime-types";
function compare(a: DeterministicProposal, b: DeterministicProposal): number {
  return compareObjectives(a.plan.objective_after, b.plan.objective_after)
    || Number(a.plan.status !== "ready") - Number(b.plan.status !== "ready")
    || a.plan.actions.length - b.plan.actions.length
    || (a.search.selected_key! < b.search.selected_key! ? -1 : a.search.selected_key! > b.search.selected_key! ? 1 : 0);
}
export async function runDeterministicPlanner<State>(context: TransitionContext, input: SimulationRun,
  jobId: string, planId: string, options: PlanningRuntimeOptions<State>, limits: SearchLimits,
  control: { deadline: number; current: () => Promise<boolean>; signal?: AbortSignal }): Promise<DeterministicProposal> {
  limits = searchLimits(limits);
  const run = normalizePlanningRun(input), seen = new Set<string>(); let best: DeterministicProposal | null = null, evaluated = 0;
  const ops = run.branches.floodops!.operations;
  let truncated = ops.drivers.filter(d => d.position.kind === "node" && d.status !== "servicing").length > limits.maxDrivers
    || ops.orders.filter(o => o.lifecycle === "unpicked").length > limits.maxOrders
    || ops.drivers.some(d => d.ordered_stops.length > limits.maxStops);
  async function active() {
    if (control.signal?.aborted || !await control.current()) throw new PlanningSearchStopped("cancelled");
    if (Date.now() >= control.deadline) throw new PlanningSearchStopped("deadline");
  }
  const services = createPlanningServices(context, run, jobId, planId, options);
  async function evaluate(spec: CandidateSpec) {
    const routeIds: string[] = [], actionIds: string[] = [];
    for (const request of spec.routes) {
      const route = await services.computeRoute(request, spec.allowPending);
      if (route.status !== "candidate") return;
      routeIds.push(route.route_id);
      if (spec.assignment && request.driver_id === spec.assignment.driver_id) {
        const action = await services.proposeAssignmentChange({ ...spec.assignment, pickup_hub_id: null,
          route_id: route.route_id, reason: "Deterministic bounded assignment candidate.", evidence_ids: route.evidence_ids });
        actionIds.push(action.action_id);
      }
    }
    const bundle = services.finalize({ action_ids: actionIds, route_ids: routeIds }), plan = bundle.plan;
    // Pending scoring uses actual soft projection; it must also satisfy POL05 without invented approvals.
    if (!["ready", "pending_approval"].includes(plan.status) || !plan.actions.length
      || compareObjectives(plan.objective_after, plan.objective_before) > 0) return;
    const result: DeterministicProposal = { ...bundle, search: { algorithm: PLANNER_VERSION, outcome: "candidate",
      evaluated, limits: { ...limits }, truncated: false, selected_key: spec.key } };
    if (!best || compare(result, best) < 0) best = result;
  }
  const current = projectCurrent(run, createCommittedMovementPolicy(context, run));
  for (const spec of searchCandidates(run, limits, current.etas)) {
    if (seen.has(spec.key)) continue;
    if (evaluated >= limits.maxCandidates) { truncated = true; break; }
    await active(); seen.add(spec.key); evaluated++;
    try { await evaluate(spec); } catch (error) {
      if (!(error instanceof OperationError) && !(error instanceof PlatformError && error.status < 500)) throw error;
    }
  }
  await active();
  const selected: DeterministicProposal = best ?? { ...services.finalize({ action_ids: [], route_ids: [] }), search: { algorithm: PLANNER_VERSION, outcome: ops.orders.every(o => o.lifecycle === "delivered") ? "no_change" : "no_feasible_plan",
    evaluated, limits: { ...limits }, truncated, selected_key: null } };
  return { ...selected, search: { ...selected.search, evaluated, truncated } };
}
