import { PlanSchema, RouteSchema } from "@floodops/contracts";
import type { Plan, Route, CandidateAssignment } from "@floodops/contracts";
import { OperationError } from "@floodops/domain/operations";
import type { SimulationCandidate, SimulationRun } from "@floodops/simulation";
import { selectDependencyGroups } from "./dependency-groups.ts";
import type { GroupSelection } from "./dependency-groups.ts";
export interface CompiledCandidate {
  candidate: SimulationCandidate; deferrals: { actionId: string; orderId: string; minutes: number }[];
  actionIdsByDriver: Record<string, string[]>;
}
function invalid(message: string): never { throw new OperationError("INVALID_CANDIDATE", message); }

/** Routes must be server-produced for this captured plan. Segment/ETA/model rule assertions are never authority. */
export function compileCandidate(plan: Plan, selection: GroupSelection, routes: readonly Route[], run: SimulationRun): CompiledCandidate {
  PlanSchema.parse(plan); routes.forEach(route => RouteSchema.parse(route));
  const ready = Object.fromEntries(plan.actions.map(action => [action.action_id, "ready" as const]));
  const closure = selectDependencyGroups(plan.actions, plan.groups, selection.eligible, ready);
  if (JSON.stringify(closure.eligible) !== JSON.stringify([...selection.eligible].sort())
    || JSON.stringify(closure.actionIds) !== JSON.stringify([...selection.actionIds].sort())) invalid("Selection omitted mandatory groups/actions.");
  if (new Set(routes.map(r => r.route_id)).size !== routes.length) invalid("Duplicate route IDs.");
  const operations = run.branches.floodops!.operations;
  const result: CompiledCandidate = { candidate: { assignments: [], stopsByDriver: {} }, deferrals: [], actionIdsByDriver: {} };
  const assignments = new Map<string, CandidateAssignment>(), driverRoutes = new Map<string, Route>(), deferred = new Set<string>();
  const stopsByDriver: Record<string, Route["stops"]> = {};
  for (const id of selection.actionIds) {
    const action = plan.actions.find(a => a.action_id === id);
    if (!action) invalid("Unknown selected action.");
    const t = action.targets;
    if (action.kind === "defer") {
      if (!t.order_id || t.defer_minute === null || t.route_id || t.hub_id || t.driver_id || deferred.has(t.order_id)) invalid("Invalid defer targets.");
      deferred.add(t.order_id); result.deferrals.push({ actionId: id, orderId: t.order_id, minutes: t.defer_minute });
      continue;
    }
    if (!t.route_id || !t.driver_id || t.defer_minute !== null) invalid("Route/driver required.");
    const route = routes.find(r => r.route_id === t.route_id);
    const driver = operations.drivers.find(d => d.driver_id === t.driver_id);
    if (!route || !plan.route_ids.includes(route.route_id) || route.driver_id !== t.driver_id
      || route.input_revision !== plan.input_revision || !driver || driver.position.node_id !== route.origin_node_id) invalid("Route binding mismatch.");
    if (action.kind === "eta_preview") {
      if (t.order_id || t.hub_id) invalid("Unexpected preview targets.");
      continue; // Preview alone never compiles an operational route replacement.
    }
    if (driverRoutes.has(t.driver_id) && driverRoutes.get(t.driver_id)!.route_id !== route.route_id) invalid("Conflicting driver routes.");
    driverRoutes.set(t.driver_id, route); stopsByDriver[t.driver_id] = structuredClone(route.stops);
    result.actionIdsByDriver[t.driver_id] = [...(result.actionIdsByDriver[t.driver_id] ?? []), id];
    if (action.kind === "reassign" || action.kind === "change_hub") {
      const order = operations.orders.find(o => o.order_id === t.order_id);
      if (!order || (action.kind === "change_hub" ? !t.hub_id : t.hub_id !== null)) invalid("Invalid assignment targets.");
      const assignment = { order_id: order.order_id, driver_id: t.driver_id, pickup_hub_id: t.hub_id };
      const previous = assignments.get(order.order_id);
      if (previous && (previous.driver_id !== assignment.driver_id || (previous.pickup_hub_id !== null
        && assignment.pickup_hub_id !== null && previous.pickup_hub_id !== assignment.pickup_hub_id))) invalid("Conflicting order assignments.");
      assignments.set(order.order_id, { ...assignment, pickup_hub_id: assignment.pickup_hub_id ?? previous?.pickup_hub_id ?? null });
    } else if (t.order_id || t.hub_id) invalid("Unexpected route-only targets.");
  }
  const canonical = [...assignments.values()].sort((a, b) => a.order_id < b.order_id ? -1 : a.order_id > b.order_id ? 1 : 0);
  for (const route of driverRoutes.values()) {
    const overrides = [...route.assignment_overrides].sort((a, b) => a.order_id < b.order_id ? -1 : a.order_id > b.order_id ? 1 : 0);
    if (new Set(overrides.map(a => a.order_id)).size !== overrides.length
      || canonical.some(a => !overrides.some(o => o.order_id === a.order_id && o.driver_id === a.driver_id && o.pickup_hub_id === a.pickup_hub_id))
      || overrides.some(o => !plan.actions.some(action => (action.kind === "reassign" || action.kind === "change_hub")
        && action.targets.order_id === o.order_id && action.targets.driver_id === o.driver_id
        && (o.pickup_hub_id === null ? action.kind === "reassign" : action.targets.hub_id === o.pickup_hub_id)))) {
      invalid("Route assignment context differs from selected candidate/plan.");
    }
    // Known excluded overrides are not applied. Reprojection derives the subset route from actual stops/state.
  }
  for (const deferral of result.deferrals) {
    const driverId = assignments.get(deferral.orderId)?.driver_id
      ?? operations.orders.find(order => order.order_id === deferral.orderId)?.driver_id;
    if (driverId) {
      result.actionIdsByDriver[driverId] = [...(result.actionIdsByDriver[driverId] ?? []), deferral.actionId];
      stopsByDriver[driverId] ??= structuredClone([...operations.drivers.find(driver => driver.driver_id === driverId)!.ordered_stops]);
    }
  }
  result.candidate = { assignments: canonical, stopsByDriver };
  return result;
}
