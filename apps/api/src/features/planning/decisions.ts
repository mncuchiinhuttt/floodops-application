import { parseSchema } from "@floodops/contracts";
import { fail } from "../../shared/index";
import type { ReducerDefinition } from "../../shared/index";
import { currentPlan, dryRun } from "./plan-evaluation";
import { idle, metadataCas, runtimeRun } from "./runtime-context";
import { planningValues, readPlanningState } from "./runtime-state";
import { planInput } from "./plan-command";
import { assemblePlan } from "./assemble-plan";
import type { ResolvedPlanningOptions } from "./runtime-types";
export function decideActions<State>(options: ResolvedPlanningOptions<State>): ReducerDefinition {
  return { permission: "planning:decide", operational: false, validate(raw) {
    const v = planInput(raw); return { ...v, request: parseSchema("PlanDecisionInput", v.request) };
  }, reduce(context, raw) {
    const v = raw as ReturnType<typeof planInput>; const decision = parseSchema("PlanDecisionInput", v.request);
    metadataCas(context, v); idle(context);
    const state = readPlanningState(context.snapshot), plan = currentPlan(context, state, v.planId);
    if (decision.action_ids.some(id => !plan.actions.some(a => a.action_id === id))) fail(422, "UNKNOWN_ENTITY");
    const approvals = decision.action_ids.map(id => parseSchema("Approval", { approval_id: "approval_" + crypto.randomUUID(),
      plan_id: plan.plan_id, action_id: id, input_revision: plan.input_revision, decision: decision.decision,
      participant_id: context.actor.participant.participant_id, reason: decision.reason, created_at: new Date(context.now).toISOString() }));
    state.approvals = [...state.approvals.filter(a => a.plan_id !== plan.plan_id || !decision.action_ids.includes(a.action_id)), ...approvals];
    state.approvalHistory.push(...approvals);
    const updated = assemblePlan(context, runtimeRun(context, options), state, plan.planning_job_id, plan.plan_id,
      plan.actions, plan.route_ids.map(id => state.routes[id]!));
    state.plans[plan.plan_id] = updated;
    return { data: parseSchema("DecisionResult", { plan_id: plan.plan_id, approvals, action_states: updated.actions }),
      values: planningValues(context.snapshot, state), events: [{ type: "proposal_changed", resource_ids: [plan.plan_id], audience: ["dispatcher"] }] };
  } };
}
export function dryRunCommand<State>(options: ResolvedPlanningOptions<State>): ReducerDefinition {
  return { permission: "planning:execute", operational: false, validate(raw) {
    const v = planInput(raw); return { ...v, request: parseSchema("CandidateInput", v.request) };
  }, reduce(context, raw) {
    const v = raw as ReturnType<typeof planInput>; metadataCas(context, v); idle(context);
    const state = readPlanningState(context.snapshot), plan = currentPlan(context, state, v.planId), input = parseSchema("CandidateInput", v.request);
    return { data: dryRun(context, runtimeRun(context, options), state, plan, input.group_ids), events: [] };
  } };
}
