import { createHash } from "node:crypto";
import { parseSchema } from "@floodops/contracts";
import type { DryRunResult, Plan, Route } from "@floodops/contracts";
import { evaluateCandidate } from "@floodops/domain/planning";
import { projectCandidate, projectCurrent } from "@floodops/simulation";
import type { SimulationRun } from "@floodops/simulation";
import { fail } from "../../shared/index";
import type { TransitionContext } from "../../shared/index";
import { normalizePlanningRun } from "./runtime-context";
import { createCommittedMovementPolicy } from "./committed-policy";
import { operationsProjection } from "../operations/projection";
import type { PlanningState } from "./runtime-types";
export const hashText = (value: string) => createHash("sha256").update(value).digest("hex");
export function evaluatePlan(context: TransitionContext, run: SimulationRun, state: PlanningState,
  plan: Plan, groups: readonly string[], anticipated = false) {
  run = normalizePlanningRun(run);
  const currentPolicy = createCommittedMovementPolicy(context, run), m = context.snapshot.meta;
  const identity = { session_id: plan.session_id, generation: plan.generation, input_revision: plan.input_revision,
    plan_id: plan.plan_id, planning_job_id: plan.planning_job_id };
  const limit = run.scenario.manifest.config.parameters.find(p => p.key === "defer_limit" && p.unit === "minute" && p.basis !== "missing")?.value ?? null;
  return evaluateCandidate({ run, plan, routes: plan.route_ids.map(id => state.routes[id]!).filter(Boolean), selectedGroupIds: groups,
    currentPolicy, authority: { identity, current: { session_id: m.session_id, generation: m.generation, revision: m.revision,
      latest_plan_id: anticipated ? plan.plan_id : context.snapshot.pointers.latest_plan_id ?? null,
      latest_requested_job_id: anticipated ? plan.planning_job_id : context.snapshot.pointers.latest_requested_job_id ?? null },
      approvals: state.approvals, epochs: run.knowledge }, deferLimitMinute: limit, hash: hashText });
}
export function currentPlan(context: TransitionContext, state: PlanningState, planId: string): Plan {
  const plan = state.plans[planId];
  if (!plan) fail(404, "NOT_FOUND");
  if (plan.input_revision !== context.snapshot.meta.revision) fail(412, "REVISION_MISMATCH", context.snapshot);
  if (plan.generation !== context.snapshot.meta.generation || context.snapshot.pointers.latest_plan_id !== planId
    || context.snapshot.pointers.latest_requested_job_id !== plan.planning_job_id) fail(409, "STALE_PROPOSAL", context.snapshot);
  return plan;
}
export function dryRun(context: TransitionContext, run: SimulationRun, state: PlanningState, plan: Plan, groups: readonly string[]): DryRunResult {
  const gate = evaluatePlan(context, run, state, plan, groups);
  const policy = createCommittedMovementPolicy(context, run), before = projectCurrent(run, policy);
  const after = gate.projection ?? projectCandidate(run, { assignments: [], stopsByDriver: {} }, policy);
  const projected = structuredClone(after.candidateRun);
  for (const order of projected.branches.floodops!.operations.orders) if (order.lifecycle !== "delivered") order.eta_minute = after.etas[order.order_id] ?? null;
  return parseSchema("DryRunResult", { plan_id: plan.plan_id, feasible: gate.status === "ready",
    eligible_group_ids: gate.selection?.eligible ?? [], excluded_group_ids: gate.selection?.excluded ?? groups,
    rules: gate.issues.map(i => ({ rule_id: i.rule_id, outcome: i.status === "pending_approval" ? "pending" : i.status === "ready" ? "pass" : i.status,
      reason: i.code, entity_ids: i.entity_ids })), objective_before: before.objective, objective_after: after.objective,
    projected_branches: operationsProjection(projected, state).branches });
}
export function routeTable(routes: readonly Route[]): Record<string, Route> { return Object.fromEntries(routes.map(r => [r.route_id, r])); }
