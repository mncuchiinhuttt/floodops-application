import { parseSchema } from "@floodops/contracts";
import type { RuntimeRegistry } from "../../shared/index";
import { runtimeRun } from "./runtime-context";
import { readPlanningState } from "./runtime-state";
import { PLANNING_VIEW, OPERATIONS_VIEW, INCIDENT_VIEW, IMPACT_VIEW } from "./runtime-types";
import type { ResolvedPlanningOptions } from "./runtime-types";
import { operationsProjection, activeRoutes } from "../operations/projection";
import { calculateImpact } from "../incidents/impact";
import { createCommittedMovementPolicy } from "./committed-policy";
export const ROUTES_VIEW = "planning.routes";
export function planningViews<State>(options: ResolvedPlanningOptions<State>): RuntimeRegistry["views"] {
  return {
    [PLANNING_VIEW]: { permission: "planning:request", roles: ["dispatcher"], project(context) {
      const state = readPlanningState(context.snapshot), meta = context.snapshot.meta, pointers = context.snapshot.pointers;
      return { jobs: Object.values(state.jobs).map(r => r.job), plans: Object.values(state.plans).map(p => {
        const stale = p.status !== "executed" && (p.input_revision !== meta.revision || pointers.latest_plan_id !== p.plan_id
          || pointers.latest_requested_job_id !== p.planning_job_id);
        return parseSchema("Plan", stale ? { ...p, status: "needs_replan", actions: p.actions.map(a => ({ ...a, status: "needs_replan" })) } : p);
      }), executions: Object.values(state.executions), notifications: Object.values(state.notifications),
      latest_requested_job_id: pointers.latest_requested_job_id ?? null };
    } },
    [OPERATIONS_VIEW]: { permission: "operations:read", roles: ["dispatcher"], project: context =>
      operationsProjection(runtimeRun(context, options), readPlanningState(context.snapshot)) },
    [INCIDENT_VIEW]: { permission: "session:read", roles: ["dispatcher", "viewer"],
      project: context => readPlanningState(context.snapshot).incidents },
    [IMPACT_VIEW]: { permission: "planning:request", roles: ["dispatcher"], project(context) {
      const run = runtimeRun(context, options);
      return calculateImpact(run, readPlanningState(context.snapshot).incidents, createCommittedMovementPolicy(context, run));
    } },
    [ROUTES_VIEW]: { permission: "session:read", roles: ["dispatcher", "driver"], project(context) {
      const state = readPlanningState(context.snapshot), run = runtimeRun(context, options);
      return context.actor.participant.role === "driver"
        ? activeRoutes(run, state, "floodops").filter(r => r.driver_id === context.actor.participant.bound_entity_id)
        : Object.values({ ...Object.fromEntries(run.scenario.manifest.initialRoutes.map(r => [r.route_id, r])), ...state.routes });
    } }
  };
}
