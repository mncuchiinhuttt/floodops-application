import type { Plan, Route } from "@floodops/contracts";
import { deferOrder, freezeValue, OperationError } from "@floodops/domain/operations";
import { canonicalJson, compareObjectives, computeRoute, projectCandidate, projectCurrent } from "@floodops/simulation";
import type { HashText, Projection, SimulationPolicy, SimulationRun } from "@floodops/simulation";
import { compileCandidate } from "./compile-candidate.ts";
import type { CompiledCandidate } from "./compile-candidate.ts";
import { selectDependencyGroups } from "./dependency-groups.ts";
import type { GroupSelection } from "./dependency-groups.ts";
import { createCurrentPolicy } from "./current-policy.ts";
import { createPlanningPolicy } from "./road-policy.ts";
import { checkProposalIdentity } from "./proposal-identity.ts";
import type { PlanningAuthority, PolicyDecision, Readiness } from "./planning-types.ts";
import { decision } from "./planning-types.ts";

export interface CandidateEvaluationInput {
  run: SimulationRun; plan: Plan; routes: readonly Route[]; selectedGroupIds: readonly string[];
  authority: PlanningAuthority; currentPolicy: SimulationPolicy; deferLimitMinute: number | null; hash: HashText;
}
export interface CandidateEvaluation {
  status: Readiness; is_projected: true; issues: PolicyDecision[]; selection: GroupSelection | null;
  compiled: CompiledCandidate | null; projection: Projection | null; routes: Route[];
}
function deferredRun(input: CandidateEvaluationInput, compiled: CompiledCandidate): SimulationRun {
  const run = structuredClone(input.run), branch = run.branches.floodops!;
  if (compiled.deferrals.length && !run.scenario.manifest.config.feature_flags.defer_standard) {
    throw new OperationError("POL-06", "Deferral disabled.");
  }
  for (const deferral of compiled.deferrals) branch.operations = deferOrder(branch.operations,
    deferral.orderId, deferral.minutes, run.nowMs / 60_000, input.deferLimitMinute);
  if (!run.scenario.manifest.config.feature_flags.change_pickup_hub && compiled.candidate.assignments.some(a =>
    a.pickup_hub_id !== null && a.pickup_hub_id !== branch.operations.orders.find(o => o.order_id === a.order_id)?.pickup_hub_id)) {
    throw new OperationError("POL-04", "Hub change disabled.");
  }
  return run;
}
export function evaluateCandidate(input: CandidateEvaluationInput): CandidateEvaluation {
  const output: CandidateEvaluation = { status: "blocked", is_projected: true, issues: [], selection: null,
    compiled: null, projection: null, routes: [] };
  const identity = checkProposalIdentity(input.plan, input.authority.current);
  if (identity.status !== "ready") return freezeValue({ ...output, status: identity.status, issues: [identity] });
  if ((["session_id", "generation", "input_revision", "plan_id", "planning_job_id"] as const)
    .some(key => input.authority.identity[key] !== input.plan[key])) {
    return freezeValue({ ...output, issues: [decision("blocked", "POL-03", "AUTHORITY_BINDING_MISMATCH")] });
  }
  if (!input.currentPolicy || typeof input.currentPolicy.authorizeEntry !== "function") {
    return freezeValue({ ...output, issues: [decision("blocked", "POL-03", "CONFIG_INCOMPLETE")] });
  }
  try {
    const currentPolicy = createCurrentPolicy(input.run, input.currentPolicy);
    const readiness: Record<string, Readiness> = {};
    // Wire statuses and model-produced rule_results do not grant readiness.
    for (const action of input.plan.actions) {
      const rejected = input.authority.approvals.some(a => a.plan_id === input.plan.plan_id
        && a.input_revision === input.plan.input_revision && a.action_id === action.action_id && a.decision === "reject");
      readiness[action.action_id] = rejected ? "blocked" : "ready";
    }
    const physical = (selection: GroupSelection) => {
      const compiled = compileCandidate(input.plan, selection, input.routes, input.run), run = deferredRun(input, compiled);
      const policy = createPlanningPolicy(run, input.authority, compiled.actionIdsByDriver, currentPolicy);
      projectCandidate(run, compiled.candidate, policy);
      return { compiled, run };
    };
    let selection = selectDependencyGroups(input.plan.actions, input.plan.groups, input.selectedGroupIds, readiness);
    try { physical(selection); } catch (combinedError) {
      // Isolate intrinsically invalid groups only after the combined candidate fails.
      // If each closure is feasible but the combination is not, reject the whole batch.
      let excluded = false;
      for (const groupId of selection.eligible) {
        const isolated = selectDependencyGroups(input.plan.actions, input.plan.groups, [groupId], readiness);
        if (!isolated.eligible.includes(groupId)) continue;
        try { physical(isolated); } catch (error) {
          excluded = true;
          for (const id of input.plan.groups.find(g => g.group_id === groupId)!.action_ids) readiness[id] = "blocked";
          const code = error instanceof OperationError ? error.code : "INVALID_CANDIDATE";
          output.issues.push(decision("blocked", code === "POL-06" || code === "CONFIG_INCOMPLETE" ? "POL-06" : "POL-04", code, [groupId]));
        }
      }
      if (!excluded) throw combinedError;
      selection = selectDependencyGroups(input.plan.actions, input.plan.groups, input.selectedGroupIds, readiness);
    }
    const { compiled: all, run } = physical(selection);
    const seen: PolicyDecision[] = [], strict = createPlanningPolicy(run, input.authority, all.actionIdsByDriver, currentPolicy, false, d => seen.push(d));
    const contextFor = (driverId: string, compiled: CompiledCandidate) => {
      const digest = input.hash(canonicalJson({ identity: input.authority.identity, driverId, candidate: compiled,
        snapshot: input.run.scenario.bundleHash, atMs: input.run.nowMs,
        operations: input.run.branches.floodops!.operations, knowledge: input.run.knowledge }));
      if (!/^[a-f0-9]{64}$/.test(digest)) throw new OperationError("CONFIG_INCOMPLETE", "SHA256 hash port required.");
      return { routeId: `rte_${digest}`, inputRevision: input.plan.input_revision, hash: input.hash };
    };
    for (const driverId of Object.keys(all.candidate.stopsByDriver)) {
      const context = contextFor(driverId, all);
      seen.length = 0;
      const route = computeRoute(run, all.candidate, driverId, strict, context);
      if (route.status === "candidate") continue;
      const soft = createPlanningPolicy(run, input.authority, all.actionIdsByDriver, currentPolicy, true);
      const pending = computeRoute(run, all.candidate, driverId, soft, context).status === "candidate";
      const stale = seen.find(d => d.status === "needs_replan");
      const issue = pending ? decision("pending_approval", "POL-02", "EXACT_APPROVAL_REQUIRED", all.actionIdsByDriver[driverId], true)
        : stale ?? decision("blocked", "POL-04", "NO_FEASIBLE_ROUTE", [driverId]);
      output.issues.push(issue);
      for (const id of all.actionIdsByDriver[driverId] ?? []) readiness[id] = issue.status;
    }
    selection = selectDependencyGroups(input.plan.actions, input.plan.groups, input.selectedGroupIds, readiness);
    output.selection = selection;
    if (!selection.eligible.length) {
      output.status = output.issues.some(d => d.status === "needs_replan") ? "needs_replan"
        : output.issues.some(d => d.status === "pending_approval") ? "pending_approval" : "blocked";
      return freezeValue(output);
    }
    const compiled = compileCandidate(input.plan, selection, input.routes, input.run), finalRun = deferredRun(input, compiled);
    const policy = createPlanningPolicy(finalRun, input.authority, compiled.actionIdsByDriver, currentPolicy);
    const before = projectCurrent(input.run, currentPolicy), after = projectCandidate(finalRun, compiled.candidate, policy);
    if (compareObjectives(after.objective, before.objective) > 0) {
      output.issues.push(decision("blocked", "POL-05", "OBJECTIVE_WORSENED"));
      return freezeValue(output);
    }
    output.compiled = compiled; output.projection = after;
    output.routes = Object.keys(compiled.candidate.stopsByDriver).map(driverId => computeRoute(finalRun,
      compiled.candidate, driverId, policy, contextFor(driverId, compiled)));
    output.status = "ready";
    return freezeValue(output);
  } catch (error) {
    const code = error instanceof OperationError ? error.code : "INVALID_CANDIDATE";
    output.issues.push(decision("blocked", code === "POL-06" || code === "CONFIG_INCOMPLETE" ? "POL-06" : "POL-04", code));
    return freezeValue(output);
  }
}
