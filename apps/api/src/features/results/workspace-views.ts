import { parseSchema } from "@floodops/contracts";
import type { Plan, PlanningJob } from "@floodops/contracts";
import { fail } from "../../shared/index";
import type { RuntimeRegistry, TransitionContext } from "../../shared/index";
import { createResultsView } from "./runtime";
import { projected, workspaceContext } from "./workspace-context";
import type { WorkspacePlanning, WorkspaceProjectionPorts } from "./workspace-types";

function planningPointers(context: TransitionContext, raw: WorkspacePlanning) {
  if (!raw || !Array.isArray(raw.plans) || !Array.isArray(raw.jobs)) fail(503, "CONFIG_INCOMPLETE");
  const plans = raw.plans.map(plan => parseSchema("Plan", plan)), jobs = raw.jobs.map(job => parseSchema("PlanningJob", job));
  const { pointers, meta } = context.snapshot;
  const select = <T extends Plan | PlanningJob>(id: string | null | undefined, values: T[], field: "plan_id" | "job_id"): T | null => {
    if (!id) return null;
    const matched = values.filter(value => (value as unknown as Record<string, unknown>)[field] === id);
    if (matched.length !== 1 || matched[0]!.session_id !== meta.session_id || matched[0]!.generation !== meta.generation) fail(503, "CONFIG_INCOMPLETE");
    return matched[0]!;
  };
  const latest_plan = select(pointers.latest_plan_id, plans, "plan_id"), active_job = select(pointers.latest_requested_job_id, jobs, "job_id");
  if (latest_plan && (!active_job || latest_plan.planning_job_id !== active_job.job_id
    || active_job.plan_id !== latest_plan.plan_id)) fail(503, "CONFIG_INCOMPLETE");
  return { latest_plan, active_job };
}
export function createWorkspaceViews<State>(ports: Partial<WorkspaceProjectionPorts<State>>): NonNullable<RuntimeRegistry["views"]> {
  return {
    snapshot: { permission: "operations:read", roles: ["dispatcher"], project(context) {
      const { input, run, scenario } = workspaceContext(context, ports), { snapshot } = input;
      const clock = parseSchema("SimulationClock", projected(ports.clock, input));
      if (clock.now_minute !== snapshot.meta.sim_minute || clock.horizon_minute !== snapshot.meta.horizon_minute
        || clock.mode !== (snapshot.meta.status === "advancing" ? "advancing" : "paused")) fail(503, "CONFIG_INCOMPLETE");
      return parseSchema("SessionSnapshot", { session: snapshot.meta, scenario, clock,
        knowledge: projected(ports.knowledge, input), operations: projected(ports.operations, input), impact: projected(ports.impact, input),
        ...planningPointers(input, projected(ports.planning, input)), results: createResultsView(ports.persistence!).project(input),
        graph_hash: run.scenario.manifest.config.graph_hash });
    } },
    overview: { permission: "results:read", roles: ["dispatcher", "viewer"], project(context) {
      const { input, scenario } = workspaceContext(context, ports);
      return parseSchema("ViewerOverview", { session: input.snapshot.meta, scenario, coverage: projected(ports.coverage, input),
        results: createResultsView(ports.persistence!).project(input) });
    } },
    "driver-dashboard": { permission: "driver:self:read", roles: ["driver"], project(context) {
      const { input, run } = workspaceContext(context, ports), id = input.actor.participant.bound_entity_id;
      if (!id) fail(403, "FORBIDDEN");
      const operations = parseSchema("Operations", projected(ports.operations, input));
      const branches = operations.branches.filter(branch => branch.branch_id === "floodops");
      if (branches.length !== 1) fail(503, "CONFIG_INCOMPLETE");
      const branch = branches[0]!, drivers = branch.drivers.filter(driver => driver.driver_id === id);
      if (drivers.length !== 1) fail(403, "FORBIDDEN");
      const routes = projected(ports.routes, input).map(route => parseSchema("Route", route));
      if (new Set(routes.map(route => route.route_id)).size !== routes.length) fail(503, "CONFIG_INCOMPLETE");
      const ownRoutes = routes.filter(route => route.driver_id === id && branch.active_route_ids.includes(route.route_id));
      const segments = run.branches.floodops?.runtime[id]?.segments;
      if ((segments?.length || drivers[0]!.ordered_stops.length) && !ownRoutes.length) fail(503, "CONFIG_INCOMPLETE");
      return parseSchema("DriverDashboard", { driver_id: id, session: input.snapshot.meta, driver: drivers[0],
        assigned_orders: branch.orders.filter(order => order.driver_id === id), route_ids: ownRoutes.map(route => route.route_id),
        own_reports: projected(ports.reports, input).filter(record => record.generation === input.snapshot.meta.generation
          && record.report.participant_id === input.actor.participant.participant_id).map(record => parseSchema("Report", record.report)) });
    } }
  };
}
