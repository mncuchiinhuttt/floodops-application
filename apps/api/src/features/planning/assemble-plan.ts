import { parseSchema } from "@floodops/contracts";
import type { Plan, PlanAction, Route } from "@floodops/contracts";
import { compileCandidate, createPlanningPolicy, selectDependencyGroups } from "@floodops/domain/planning";
import { deferOrder } from "@floodops/domain/operations";
import { projectCandidate, projectCurrent } from "@floodops/simulation";
import type { SimulationRun } from "@floodops/simulation";
import type { TransitionContext } from "../../shared/index";
import { normalizePlanningRun } from "./runtime-context";
import { createCommittedMovementPolicy } from "./committed-policy";
import { evaluatePlan, hashText, routeTable } from "./plan-evaluation";
import type { PlanningState } from "./runtime-types";

export function assemblePlan(context: TransitionContext, run: SimulationRun, state: PlanningState,
  jobId: string, planId: string, sourceActions: readonly PlanAction[], routes: readonly Route[]): Plan {
  run = normalizePlanningRun(run);
  const actions = structuredClone([...sourceActions]), parent = new Map<string, string>();
  const find = (id: string): string => { const p = parent.get(id) ?? id; if (p === id) { parent.set(id, id); return id; }
    const root = find(p); parent.set(id, root); return root; };
  const keys = (a: PlanAction) => {
    const old = run.branches.floodops!.operations.orders.find(o => o.order_id === a.targets.order_id)?.driver_id;
    return [a.targets.driver_id, old].filter((id): id is string => !!id).map(id => "driver:" + id);
  };
  for (const action of actions) {
    const refs = keys(action); if (!refs.length) refs.push("order:" + action.targets.order_id);
    for (const ref of refs) parent.set(find(ref), find(refs[0]!));
  }
  for (const action of actions) {
    const key = keys(action)[0] ?? "order:" + action.targets.order_id;
    action.dependency_group_id = "group_" + hashText(jobId + find(key)).slice(0, 40);
    action.depends_on_action_ids = []; action.status = "proposed"; action.rule_results = [];
  }
  const policy = createCommittedMovementPolicy(context, run), before = projectCurrent(run, policy);
  let plan = parseSchema("Plan", { plan_id: planId, session_id: context.snapshot.meta.session_id,
    generation: context.snapshot.meta.generation, input_revision: context.snapshot.meta.revision, planning_job_id: jobId,
    status: "proposed", actions, groups: [...new Set(actions.map(a => a.dependency_group_id))].map(id => ({
      group_id: id, action_ids: actions.filter(a => a.dependency_group_id === id).map(a => a.action_id), depends_on_group_ids: [] })),
    route_ids: [...new Set(routes.map(r => r.route_id))], objective_before: before.objective,
    objective_after: before.objective, diff: [], is_projected: true });
  const working = { ...state, routes: { ...state.routes, ...routeTable(routes) } };
  const gate = evaluatePlan(context, run, working, plan, plan.groups.map(g => g.group_id), true);
  let after = gate.projection ?? before;
  if (!gate.projection) try {
    const ready = Object.fromEntries(actions.map(a => [a.action_id, "ready" as const]));
    const selection = selectDependencyGroups(actions, plan.groups, plan.groups.map(g => g.group_id), ready);
    const compiled = compileCandidate(plan, selection, routes, run), scratch = structuredClone(run);
    const limit = run.scenario.manifest.config.parameters.find(p => p.key === "defer_limit" && p.unit === "minute")?.value ?? null;
    for (const d of compiled.deferrals) scratch.branches.floodops!.operations = deferOrder(scratch.branches.floodops!.operations,
      d.orderId, d.minutes, run.nowMs / 60000, limit);
    const identity = { session_id: plan.session_id, generation: plan.generation, input_revision: plan.input_revision,
      plan_id: planId, planning_job_id: jobId };
    after = projectCandidate(scratch, compiled.candidate, createPlanningPolicy(scratch, { identity,
      current: { session_id: identity.session_id, generation: identity.generation, revision: identity.input_revision,
        latest_plan_id: planId, latest_requested_job_id: jobId }, approvals: working.approvals, epochs: run.knowledge },
    compiled.actionIdsByDriver, policy, true));
  } catch { /* No feasible proposed transition: the projected outcome remains the actual unchanged current projection. */ }
  plan = { ...plan, status: gate.status, objective_after: after.objective,
    actions: actions.map(a => {
      const eligible = gate.selection?.eligible.includes(a.dependency_group_id);
      const pending = gate.issues.some(i => i.status === "pending_approval" && i.entity_ids.includes(a.action_id));
      const status = eligible ? "ready" : pending ? "pending_approval" : gate.status === "needs_replan" ? "needs_replan" : "blocked";
      return { ...a, status, rule_results: [{ rule_id: status === "pending_approval" ? "POL-02" : status === "ready" ? "POL-08" : "POL-04",
        outcome: status === "pending_approval" ? "pending" : status === "ready" ? "pass" : status,
        reason: status, entity_ids: [a.action_id] }] };
    }),
    diff: run.branches.floodops!.operations.orders.flatMap(order => {
      const previous = before.etas[order.order_id] ?? null, next = after.etas[order.order_id] ?? null;
      const related = actions.filter(a => a.targets.order_id === order.order_id || a.targets.driver_id === order.driver_id);
      return previous !== next || related.some(a => ["reassign", "change_hub", "defer"].includes(a.kind)) ? [{
        entity_id: order.order_id, change: "changed" as const, before_eta_minute: previous, after_eta_minute: next,
        reason: related.map(a => a.reason).join("; ").slice(0, 2000), evidence_ids: [...new Set(related.flatMap(a => a.evidence_ids))] }] : [];
    }) };
  return parseSchema("Plan", plan);
}
