import type { Driver, Stop } from "@floodops/contracts";
import type { BranchId, SimulationPolicy, SimulationRun } from "./run-types.ts";
import { findRoute } from "../graph/index.ts";
import { minutesToMilliseconds } from "../clock/index.ts";
import { checkEntry } from "./entry-policy.ts";

export function routeStops(run: SimulationRun, branchId: BranchId, driver: Driver, stops: readonly Stop[], policy: SimulationPolicy) {
  if (driver.position.kind !== "node") throw new Error("Routing a moving driver needs its next node boundary.");
  let from = driver.position.node_id!, atMs = run.nowMs;
  let incoming = run.branches[branchId]!.runtime[driver.driver_id]!.incoming;
  const segments: string[] = [];
  for (const stop of stops) {
    const route = findRoute(run.scenario.routing, { from, to: stop.node_id, vehicle: driver.vehicle_type,
      departureMs: atMs, ...(incoming ? { incomingEdgeId: incoming } : {}) },
    (segmentId, time) => checkEntry(run, branchId, driver, segmentId, time, policy).allowed);
    if (!route) return null;
    segments.push(...route.edgeIds); atMs = route.arrivalMs;
    if (route.edgeIds.length) incoming = route.edgeIds.at(-1)!;
    if (stop.kind === "pickup") atMs = Math.max(atMs,
      minutesToMilliseconds(run.branches[branchId]!.operations.deferredUntilMinute[stop.order_id] ?? 0));
    atMs += minutesToMilliseconds(stop.service_minute); from = stop.node_id;
    if (!Number.isSafeInteger(atMs)) throw new Error("Route time overflow.");
  }
  return { segments, arrivalMs: atMs };
}
