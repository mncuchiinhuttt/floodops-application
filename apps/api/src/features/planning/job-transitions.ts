import { parseSchema } from "@floodops/contracts";
import type { Plan, Route } from "@floodops/contracts";
import { fail } from "../../shared/index";
import type { ReducerDefinition, TransitionContext } from "../../shared/index";
import { assertJobAuthority, jobAuthority } from "./job-leases";
import { planningValues, readPlanningState } from "./runtime-state";
import { runtimeRun } from "./runtime-context";
import { assemblePlan } from "./assemble-plan";
import { routeTable } from "./plan-evaluation";
import type { ResolvedPlanningOptions } from "./runtime-types";
export function beginPlanning(): ReducerDefinition {
  return { permission: "planning:request", operational: false, validate: jobAuthority, reduce(context, raw) {
    const input = jobAuthority(raw), state = readPlanningState(context.snapshot), record = state.jobs[input.job_id];
    if (!record) fail(404, "NOT_FOUND"); assertJobAuthority(context, record, input);
    if (record.attemptId || record.job.status !== "queued") return { data: { claimed: false }, events: [] };
    parseSchema("Id", input.attempt_id); record.attemptId = input.attempt_id; record.job.status = "running";
    const captured: TransitionContext = { ...context, snapshot: { ...context.snapshot, values: record.capturedValues,
      meta: record.capturedMeta, pointers: { latest_requested_job_id: input.job_id, latest_plan_id: null } } };
    return { data: { claimed: true, job: record.job, planId: record.planId, context: captured,
      deadline: context.snapshot.leases[input.lease_id]!.expires_at },
      values: planningValues(context.snapshot, state), events: [{ type: "planning_job_changed", resource_ids: [input.job_id], audience: ["dispatcher"] }] };
  } };
}
export function completePlanning<State>(options: ResolvedPlanningOptions<State>): ReducerDefinition {
  return { permission: "planning:request", operational: false, validate(raw) { jobAuthority(raw); return raw; }, reduce(context, raw) {
    const input = raw as { proposal?: { plan: Plan; routes: Route[] }; error_code?: string } & ReturnType<typeof jobAuthority>;
    const state = readPlanningState(context.snapshot), record = state.jobs[input.job_id];
    if (!record) fail(404, "NOT_FOUND"); const lease = assertJobAuthority(context, record, input);
    if (record.attemptId !== input.attempt_id || record.job.status !== "running") fail(409, "STATE_CONFLICT");
    if (!!input.proposal === !!input.error_code) fail(422, "INVALID_SCHEMA");
    if (input.error_code) {
      if (!["MODEL_TIMEOUT", "MODEL_REFUSED", "MODEL_INVALID_OUTPUT", "MODEL_UNAVAILABLE"].includes(input.error_code)) fail(422, "INVALID_SCHEMA");
      record.job = { ...record.job, status: "failed", error_code: input.error_code as "MODEL_TIMEOUT", completed_at: new Date(context.now).toISOString() };
    } else {
      const draft = parseSchema("Plan", input.proposal!.plan), routes = input.proposal!.routes.map(r => parseSchema("Route", r));
      if (draft.plan_id !== record.planId || draft.planning_job_id !== record.job.job_id || draft.input_revision !== record.job.input_revision
        || draft.session_id !== record.job.session_id || draft.generation !== record.job.generation || draft.actions.length > 100 || routes.length > 100) fail(422, "INVALID_SCHEMA");
      const plan = assemblePlan(context, runtimeRun(context, options), { ...state, routes: { ...state.routes, ...routeTable(routes) } },
        record.job.job_id, record.planId, draft.actions, routes);
      state.plans[plan.plan_id] = plan; Object.assign(state.routes, routeTable(routes));
      record.job = { ...record.job, status: "completed", plan_id: plan.plan_id, completed_at: new Date(context.now).toISOString() };
    }
    return { data: record.job, values: planningValues(context.snapshot, state),
      pointers: input.proposal ? { latest_plan_id: record.planId } : undefined,
      leases: [{ ...lease, status: "completed" }],
      events: [{ type: "planning_job_changed", resource_ids: [input.job_id], audience: ["dispatcher"] },
        ...(input.proposal ? [{ type: "proposal_changed" as const, resource_ids: [record.planId], audience: ["dispatcher" as const] }] : [])] };
  } };
}
export function cancelPlanning(): ReducerDefinition {
  return { permission: "planning:request", operational: false, validate: raw => parseSchema("Id", raw), reduce(context, input) {
    const state = readPlanningState(context.snapshot), record = state.jobs[input as string];
    if (!record) fail(404, "NOT_FOUND");
    if (!["queued", "running", "cancelled"].includes(record.job.status)) fail(409, "STATE_CONFLICT");
    record.job = { ...record.job, status: "cancelled", error_code: null, completed_at: new Date(context.now).toISOString() };
    const lease = context.snapshot.leases[record.leaseId];
    return { data: record.job, values: planningValues(context.snapshot, state), leases: lease ? [{ ...lease, status: "superseded" }] : [],
      pointers: context.snapshot.pointers.latest_requested_job_id === record.job.job_id ? { latest_requested_job_id: null, latest_plan_id: null } : undefined,
      events: [{ type: "planning_job_changed", resource_ids: [record.job.job_id], audience: ["dispatcher"] }] };
  } };
}
