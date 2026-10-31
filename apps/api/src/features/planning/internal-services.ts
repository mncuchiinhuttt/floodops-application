import { parseSchema, parseToolInput, parseToolOutput } from "@floodops/contracts";
import type { Notification, Observation, PlanAction, Route, ToolName, ToolInput, ToolOutput } from "@floodops/contracts";
import { canonicalJson, computeRoute } from "@floodops/simulation";
import type { SimulationRun } from "@floodops/simulation";
import { createPlanningPolicy } from "@floodops/domain/planning";
import { fail } from "../../shared/index";
import type { TransitionContext } from "../../shared/index";
import type { PlanningRuntimeOptions } from "./runtime-types";
import { readPlanningState } from "./runtime-state";
import { hashText, routeTable, dryRun } from "./plan-evaluation";
import { createCommittedMovementPolicy } from "./committed-policy";
import { capturedSessionSnapshot } from "./snapshot";
import { calculateImpact } from "../incidents/impact";
import { assemblePlan } from "./assemble-plan";
import { normalizePlanningRun } from "./runtime-context";
import { candidateForRoute } from "./tool-stops";
export function createPlanningServices<State>(context: TransitionContext, run: SimulationRun, jobId: string, planId: string,
  options: PlanningRuntimeOptions<State>) {
  run = normalizePlanningRun(run);
  const state = readPlanningState(context.snapshot), routes: Record<string, Route> = {}, actions: Record<string, PlanAction> = {};
  const related: Record<string, string[]> = {}; let counter = 0;
  const id = (prefix: string, body: unknown) => prefix + "_" + hashText(canonicalJson([jobId, counter++, body])).slice(0, 48);
  const policy = createCommittedMovementPolicy(context, run);
  const identity = { session_id: context.snapshot.meta.session_id, generation: context.snapshot.meta.generation,
    input_revision: context.snapshot.meta.revision, plan_id: planId, planning_job_id: jobId };
  const proposalPolicy = (driver: string, allowPending: boolean) => createPlanningPolicy(run, { identity, current: {
    session_id: identity.session_id, generation: identity.generation, revision: identity.input_revision,
    latest_plan_id: planId, latest_requested_job_id: jobId }, approvals: [], epochs: run.knowledge },
    { [driver]: ["action_probe001"] }, policy, allowPending);
  function evidence(ids: readonly string[]): void {
    const pool = new Set([...run.sourceSnapshot.observations.filter(o => o.observed_sim_minute <= run.nowMs / 60000)
      .flatMap(o => [o.observation_id, ...o.evidence_ids]), ...run.sourceSnapshot.restrictions.filter(r =>
        r.effective_sim_minute <= run.nowMs / 60000).map(r => r.restriction_id), ...state.incidents.map(i => i.incident_id)]);
    if (ids.some(value => !pool.has(value))) fail(422, "UNKNOWN_ENTITY");
  }
  function action(kind: PlanAction["kind"], targets: PlanAction["targets"], reason: string, evidenceIds: string[]): PlanAction {
    evidence(evidenceIds);
    const result = parseSchema("PlanAction", { action_id: id("action", targets), kind, targets,
      dependency_group_id: id("group", targets), depends_on_action_ids: [], reason, evidence_ids: evidenceIds,
      rule_results: [], status: "proposed" }); actions[result.action_id] = result; return result;
  }
  async function invoke<N extends ToolName>(name: N, raw: ToolInput<N>, allowPending = true): Promise<ToolOutput<N>> {
    const input = parseToolInput(name, raw);
    let output: unknown;
    switch (name) {
      case "get_incident_state": output = capturedSessionSnapshot(context, run); break;
      case "get_affected_orders": {
        const value = input as { incident_ids: string[] };
        if (value.incident_ids.some(i => !state.incidents.some(r => r.incident_id === i))) fail(422, "UNKNOWN_ENTITY");
        output = calculateImpact(run, state.incidents.filter(i => value.incident_ids.includes(i.incident_id)), policy); break;
      }
      case "compute_route": {
        const value = parseToolInput("compute_route", raw), candidate = candidateForRoute(run, value, text => id("stop", text));
        const routeId = id("route", value);
        const result = computeRoute(run, candidate, value.driver_id, proposalPolicy(value.driver_id, allowPending), { routeId, inputRevision: identity.input_revision, hash: hashText });
        routes[result.route_id] = result; related[result.route_id] = [];
        for (const driverId of Object.keys(candidate.stopsByDriver)) if (driverId !== value.driver_id) {
          const cleanup = computeRoute(run, candidate, driverId, proposalPolicy(driverId, allowPending), { routeId: id("route", [routeId, driverId]),
            inputRevision: identity.input_revision, hash: hashText });
          routes[cleanup.route_id] = cleanup; related[result.route_id]!.push(cleanup.route_id);
        }
        output = result; break;
      }
      case "propose_assignment_change": {
        const value = parseToolInput("propose_assignment_change", raw), route = routes[value.route_id];
        if (!route || route.driver_id !== value.driver_id || !run.branches.floodops!.operations.orders.some(o => o.order_id === value.order_id)
          || !route.assignment_overrides.some(a => a.order_id === value.order_id && a.driver_id === value.driver_id && a.pickup_hub_id === value.pickup_hub_id)) fail(422, "UNKNOWN_ENTITY");
        output = action(value.pickup_hub_id ? "change_hub" : "reassign", { order_id: value.order_id, driver_id: value.driver_id,
          hub_id: value.pickup_hub_id, route_id: value.route_id, defer_minute: null }, value.reason, value.evidence_ids); break;
      }
      case "propose_order_deferral": {
        const value = parseToolInput("propose_order_deferral", raw);
        if (!run.branches.floodops!.operations.orders.some(o => o.order_id === value.order_id)) fail(422, "UNKNOWN_ENTITY");
        output = action("defer", { order_id: value.order_id, driver_id: null, hub_id: null, route_id: null,
          defer_minute: value.defer_minute }, value.reason, value.evidence_ids); break;
      }
      case "test_reassignment": {
        const value = parseToolInput("test_reassignment", raw);
        if (value.actions.some(a => !actions[a.action_id] || canonicalJson(actions[a.action_id]) !== canonicalJson(a))) fail(422, "UNKNOWN_ENTITY");
        const bundle = finalize({ action_ids: value.actions.map(a => a.action_id), route_ids: [] });
        const selectedRoutes = bundle.routes, plan = bundle.plan;
        const working = { ...state, plans: { ...state.plans, [planId]: plan }, routes: { ...state.routes, ...routeTable(selectedRoutes) } };
        output = dryRun({ ...context, snapshot: { ...context.snapshot, pointers: { ...context.snapshot.pointers,
          latest_plan_id: planId, latest_requested_job_id: jobId } } }, run, working, plan, plan.groups.map(g => g.group_id)); break;
      }
      case "draft_customer_notification": {
        const value = parseToolInput("draft_customer_notification", raw);
        const order = run.branches.floodops!.operations.orders.find(o => o.order_id === value.order_id);
        if (!order || value.committed_revision !== identity.input_revision) fail(422, "UNKNOWN_ENTITY");
        output = { notification_id: id("notification", value), order_id: order.order_id, committed_revision: identity.input_revision,
          eta_minute: order.eta_minute, message: order.eta_minute === null ? "Awaiting a committed route." : `Committed ETA: ${order.eta_minute} minutes.`,
          is_preview_only: true, is_simulated: true } satisfies Notification; break;
      }
      case "record_road_observation": {
        const value = parseToolInput("record_road_observation", raw); evidence(value.evidence_ids);
        if (!options.observationProposal) fail(503, "CONFIG_INCOMPLETE");
        output = parseSchema("Observation", options.observationProposal(context, run, value));
        const proposal = output as Observation;
        if (proposal.segment_id !== value.segment_id || proposal.condition !== value.condition
          || canonicalJson([...proposal.vehicle_types].sort()) !== canonicalJson([...value.vehicle_types].sort())
          || !proposal.evidence_ids.includes(value.report_id)) fail(422, "INVALID_SCHEMA"); break;
      }
    }
    return parseToolOutput(name, output);
  }
  function finalize(selection: { action_ids: string[]; route_ids: string[] }) {
    if (selection.action_ids.some(a => !actions[a]) || selection.route_ids.some(r => !routes[r])) fail(422, "UNKNOWN_ENTITY");
    const selected = selection.action_ids.map(a => actions[a]!);
    const routeIds = new Set([...selection.route_ids, ...selected.flatMap(a => a.targets.route_id ? [a.targets.route_id] : [])]);
    for (const routeId of [...routeIds]) for (const cleanup of related[routeId] ?? []) routeIds.add(cleanup);
    for (const routeId of routeIds) if (!selected.some(a => a.targets.route_id === routeId)) {
      const route = routes[routeId]!;
      selected.push(action("reroute", { order_id: null, driver_id: route.driver_id, hub_id: null, route_id: routeId, defer_minute: null },
        "Captured server-computed route proposal.", route.evidence_ids));
    }
    const selectedRoutes = [...routeIds].map(r => routes[r]!);
    return { plan: assemblePlan(context, run, state, jobId, planId, selected, selectedRoutes), routes: selectedRoutes };
  }
  return {
    getIncidentState: () => invoke("get_incident_state", {}),
    getAffectedOrders: (input: ToolInput<"get_affected_orders">) => invoke("get_affected_orders", input),
    computeRoute: (input: ToolInput<"compute_route">, allowPending = true) => invoke("compute_route", input, allowPending),
    proposeAssignmentChange: (input: ToolInput<"propose_assignment_change">) => invoke("propose_assignment_change", input),
    proposeOrderDeferral: (input: ToolInput<"propose_order_deferral">) => invoke("propose_order_deferral", input),
    testReassignment: (input: ToolInput<"test_reassignment">) => invoke("test_reassignment", input),
    draftCustomerNotification: (input: ToolInput<"draft_customer_notification">) => invoke("draft_customer_notification", input),
    recordRoadObservation: (input: ToolInput<"record_road_observation">) => invoke("record_road_observation", input),
    finalize
  };
}
