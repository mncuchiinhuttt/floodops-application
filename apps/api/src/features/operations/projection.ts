import { parseSchema } from "@floodops/contracts";
import type { Operations, Route } from "@floodops/contracts";
import type { BranchId, SimulationRun } from "@floodops/simulation";
import type { PlanningState } from "../planning/runtime-types";
export function activeRoutes(run: SimulationRun, state: PlanningState, branch: BranchId): Route[] {
  const current = run.branches[branch];
  if (!current) return [];
  return current.operations.drivers.flatMap(driver => {
    const id = state.committedRoutes[`${branch}:${driver.driver_id}`];
    const route = id ? state.routes[id] : run.scenario.manifest.initialRoutes.find(r => r.driver_id === driver.driver_id);
    return route && JSON.stringify(route.segment_ids) === JSON.stringify(current.runtime[driver.driver_id]?.segments) ? [route] : [];
  });
}
export function operationsProjection(run: SimulationRun, state: PlanningState): Operations {
  return parseSchema("Operations", { branches: Object.entries(run.branches).map(([id, branch]) => ({
    branch_id: id, ...structuredClone(branch.operations),
    active_route_ids: activeRoutes(run, state, id as BranchId).map(r => r.route_id),
    deferredUntilMinute: undefined
  })).map(({ deferredUntilMinute: _deferred, ...branch }) => { void _deferred; return branch; }) });
}
