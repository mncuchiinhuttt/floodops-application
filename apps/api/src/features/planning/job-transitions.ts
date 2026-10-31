import { PLANNER_VERSION, searchLimits } from "./deterministic-types";
import type { SearchEvidence } from "./deterministic-types";
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
    const input = raw as { proposal?: { plan: Plan; routes: Route[] }; error_code?: string; search?: SearchEvidence } & ReturnType<typeof jobAuthority>;
    const state = readPlanningState(context.snapshot), record = state.jobs[input.job_id];
    if (!record) fail(404, "NOT_FOUND"); const lease = assertJobAuthority(context, record, input);
    if (record.attemptId !== input.attempt_id || record.job.status !== "running") fail(409, "STATE_CONFLICT");
    if (input.search) {
      const search = input.search;
      if (search.algorithm !== PLANNER_VERSION || !["candidate", "no_feasible_plan", "no_change"].includes(search.outcome)
        || !Number.isSafeInteger(search.evaluated) || search.evaluated < 0 || search.evaluated > options.limits.maxCandidates
        || typeof search.truncated !== "boolean" || (search.selected_key !== null
          && (typeof search.selected_key !== "string" || search.selected_key.length > 65536))
        || JSON.stringify(searchLimits(search.limits)) !== JSON.stringify(options.limits)) fail(422, "INVALID_SCHEMA");
      record.search = structuredClone(search);
    }
    if (!!input.proposal === !!input.error_code) fail(422, "INVALID_SCHEMA");
    const errorCode = input.error_code ?? (input.search?.outcome === "no_feasible_plan" ? "NO_FEASIBLE_PLAN" : null);
    if (errorCode) {
      if (!["NO_FEASIBLE_PLAN", "PLANNER_TIMEOUT", "CONFIG_INCOMPLETE", "STATE_CONFLICT", "STALE_PROPOSAL",
        "SESSION_RESET", "SESSION_EXPIRED", "STORAGE_UNAVAILABLE"].includes(errorCode)
        || (errorCode === "NO_FEASIBLE_PLAN" && input.search?.outcome !== "no_feasible_plan")) fail(422, "INVALID_SCHEMA");
      record.job = parseSchema("PlanningJob", { ...record.job, status: "failed", plan_id: null,
        error_code: errorCode, completed_at: new Date(context.now).toISOString() });
    } else {
      const draft = parseSchema("Plan", input.proposal!.plan), routes = input.proposal!.routes.map(r => parseSchema("Route", r));
      if (draft.plan_id !== record.planId || draft.planning_job_id !== record.job.job_id || draft.input_revision !== record.job.input_revision
        || draft.session_id !== record.job.session_id || draft.generation !== record.job.generation || draft.actions.length > 100 || routes.length > 100) fail(422, "INVALID_SCHEMA");
      const plan = assemblePlan(context, runtimeRun(context, options), { ...state, routes: { ...state.routes, ...routeTable(routes) } },
        record.job.job_id, record.planId, draft.actions, routes);
      state.plans[plan.plan_id] = plan; Object.assign(state.routes, routeTable(routes));
      record.job = parseSchema("PlanningJob", { ...record.job, status: "completed", plan_id: plan.plan_id, error_code: null, completed_at: new Date(context.now).toISOString() });
    }
    return { data: record.job, values: planningValues(context.snapshot, state),
      pointers: { latest_plan_id: errorCode ? null : record.planId },
      leases: [{ ...lease, status: errorCode ? "failed" : "completed", error_code: errorCode }],
      events: [{ type: "planning_job_changed", resource_ids: [input.job_id], reason_code: errorCode, audience: ["dispatcher"] },
        ...(!errorCode ? [{ type: "proposal_changed" as const, resource_ids: [record.planId], audience: ["dispatcher" as const] }] : [])] };
  } };
}
export function cancelPlanning(): ReducerDefinition {
  return { permission: "planning:request", operational: false, validate: raw => parseSchema("Id", raw), reduce(context, input) {
    const state = readPlanningState(context.snapshot), record = state.jobs[input as string];
    if (!record) fail(404, "NOT_FOUND");
    if (!["queued", "running", "cancelled"].includes(record.job.status)) fail(409, "STATE_CONFLICT");
    record.job = parseSchema("PlanningJob", { ...record.job, status: "cancelled", plan_id: null, error_code: null, completed_at: new Date(context.now).toISOString() });
    const lease = context.snapshot.leases[record.leaseId];
    return { data: record.job, values: planningValues(context.snapshot, state), leases: lease ? [{ ...lease, status: "superseded" }] : [],
      pointers: context.snapshot.pointers.latest_requested_job_id === record.job.job_id ? { latest_requested_job_id: null, latest_plan_id: null } : undefined,
      events: [{ type: "planning_job_changed", resource_ids: [record.job.job_id], audience: ["dispatcher"] }] };
  } };
}
