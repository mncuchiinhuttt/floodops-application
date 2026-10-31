import { applyAssignmentCandidate, cloneOperations, freezeValue } from "@floodops/domain/operations";
import type { Objective } from "@floodops/contracts";
import type { SimulationCandidate, SimulationPolicy, SimulationRun } from "../movement/run-types.ts";
import { advanceInternal } from "../movement/advance-run.ts";
import { routeStops } from "../movement/route-stops.ts";
import { millisecondsToMinutes, minutesToMilliseconds } from "../clock/index.ts";
import { scopedParameter } from "../scenario/scenario-types.ts";
import { objectiveFromEtas } from "./objective.ts";

export interface Projection { objective: Objective; etas: Record<string, number | null>; candidateRun: SimulationRun }
export function prepareCandidate(input: SimulationRun, candidate: SimulationCandidate, policy: SimulationPolicy): SimulationRun {
  if (input.pendingTargetMs !== null) throw new Error("ADVANCE_IN_PROGRESS");
  const run = structuredClone(input), branch = run.branches.floodops!;
  branch.operations = applyAssignmentCandidate(branch.operations, candidate,
    (stop, order) => scopedParameter(run.scenario.manifest.config.parameters, `pickup_service:${order.order_id}:${order.pickup_hub_id}`, "minute").value!);
  // Mutable detached operational copy is used only inside this pure candidate computation.
  branch.operations = cloneOperations(branch.operations);
  for (const driverId of Object.keys(candidate.stopsByDriver)) {
    const driver = branch.operations.drivers.find(item => item.driver_id === driverId)!;
    const route = routeStops(run, "floodops", driver, driver.ordered_stops, policy);
    branch.runtime[driverId] = { segments: route?.segments ?? [], cursor: 0,
      incoming: branch.runtime[driverId]!.incoming, serviceEndMs: null, activeStop: null, wakeAtMs: null, needsReroute: false };
    driver.status = route ? "idle" : "waiting";
    for (const order of branch.operations.orders) if (order.driver_id === driverId && order.lifecycle !== "delivered") order.eta_minute = null;
  }
  return run;
}
function projectionLimit(run: SimulationRun): number {
  const edges = run.scenario.routing.edges;
  const duration = Math.max(1, ...edges.flatMap(edge => Object.values(edge.travel).flatMap(profile => profile.map(point => point.durationMs))));
  const stops = run.branches.floodops!.operations.drivers.flatMap(driver => driver.ordered_stops);
  const release = Math.max(0, ...Object.values(run.branches.floodops!.operations.deferredUntilMinute).map(minutesToMilliseconds));
  const bound = Math.max(run.nowMs, run.scenario.horizonMs, release) + duration * Math.max(1, edges.length) * (stops.length + 1)
    + stops.reduce((sum, stop) => sum + minutesToMilliseconds(stop.service_minute), 0) + 1;
  if (!Number.isSafeInteger(bound)) throw new Error("Projection horizon overflow.");
  return bound;
}
export function projectCurrent(input: SimulationRun, policy: SimulationPolicy): Projection {
  if (input.pendingTargetMs !== null) throw new Error("ADVANCE_IN_PROGRESS");
  const candidateRun = structuredClone(input), branch = candidateRun.branches.floodops!;
  const scratch = { ...structuredClone(input), branches: { floodops: structuredClone(branch) } };
  const projected = advanceInternal(scratch, projectionLimit(scratch), policy, 100_000);
  if (!projected.complete) throw new Error("PROJECTION_BUDGET_EXCEEDED");
  const etas: Record<string, number | null> = {};
  for (const order of projected.run.branches.floodops!.operations.orders) etas[order.order_id] = order.delivered_at_minute;
  return freezeValue({ objective: objectiveFromEtas(branch.operations.orders, etas, millisecondsToMinutes(input.scenario.horizonMs)), etas, candidateRun });
}
export function projectCandidate(input: SimulationRun, candidate: SimulationCandidate, policy: SimulationPolicy): Projection {
  return projectCurrent(prepareCandidate(input, candidate, policy), policy);
}
