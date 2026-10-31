import type { Driver } from "@floodops/contracts";
import { OperationError } from "@floodops/domain/operations";
import type { BranchId, SimulationPolicy, SimulationRun } from "./run-types.ts";
import { appendLog } from "./run-log.ts";
import { checkEntry } from "./entry-policy.ts";
import { completeStop } from "./stop-service.ts";
import { routeStops } from "./route-stops.ts";
import { isTravelTimeAvailable, travelDurationMs } from "../graph/index.ts";
import { millisecondsToMinutes, minutesToMilliseconds } from "../clock/index.ts";

function wait(run: SimulationRun, id: BranchId, driver: Driver, reason: string, segmentId: string | null, category: "road" | "feasibility" = "road"): void {
  driver.status = "waiting";
  for (const order of run.branches[id]!.operations.orders) if (order.driver_id === driver.driver_id && order.lifecycle !== "delivered") order.eta_minute = null;
  appendLog(run, id, "blocked", { driverId: driver.driver_id, segmentId, reason, scope: "movement", category,
    attemptId: JSON.stringify([run.runId, id, driver.driver_id, run.nowMs, segmentId, reason]) });
}
export function settleDriver(run: SimulationRun, id: BranchId, driver: Driver, policy: SimulationPolicy): void {
  const runtime = run.branches[id]!.runtime[driver.driver_id]!;
  if (runtime.wakeAtMs !== null && runtime.wakeAtMs <= run.nowMs) { runtime.wakeAtMs = null; driver.status = "idle"; }
  if (driver.status === "waiting") return;
  const budget = runtime.segments.length + driver.ordered_stops.length * 2 + 4;
  for (let transition = 0; transition < budget; transition++) {
    if (driver.position.kind === "on_edge") {
      if (minutesToMilliseconds(driver.position.exit_sim_minute!) > run.nowMs) return;
      const segmentId = driver.position.segment_id!;
      const edge = run.scenario.routing.edges.find(edge => edge.id === segmentId)!;
      driver.position = { kind: "node", node_id: edge.to, segment_id: null, entered_sim_minute: null, exit_sim_minute: null };
      runtime.incoming = segmentId; driver.status = "idle";
      appendLog(run, id, "arrival", { driverId: driver.driver_id, segmentId });
    }
    if (runtime.serviceEndMs !== null) {
      if (runtime.serviceEndMs > run.nowMs) return;
      try { completeStop(run, id, driver, runtime.activeStop!); }
      catch (error) {
        if (!(error instanceof OperationError)) throw error;
        runtime.serviceEndMs = null; runtime.activeStop = null;
        wait(run, id, driver, error.code, null, "feasibility"); return;
      }
      runtime.serviceEndMs = null; runtime.activeStop = null; driver.status = "idle";
      continue;
    }
    const stop = driver.ordered_stops[0];
    if (!stop) { driver.status = "idle"; return; }
    if (driver.position.node_id === stop.node_id) {
      const release = minutesToMilliseconds(run.branches[id]!.operations.deferredUntilMinute[stop.order_id] ?? 0);
      if (stop.kind === "pickup" && release > run.nowMs) { runtime.wakeAtMs = release; driver.status = "waiting"; return; }
      runtime.activeStop = { ...stop }; runtime.serviceEndMs = run.nowMs + minutesToMilliseconds(stop.service_minute);
      if (!Number.isSafeInteger(runtime.serviceEndMs)) throw new Error("Service time overflow.");
      driver.status = "servicing";
      appendLog(run, id, "service_start", { driverId: driver.driver_id, orderId: stop.order_id });
      continue;
    }
    if (id === "reroute_only" && runtime.needsReroute) {
      const route = routeStops(run, id, driver, driver.ordered_stops, policy);
      if (route) { runtime.segments = route.segments; runtime.cursor = 0; runtime.needsReroute = false; }
      else { wait(run, id, driver, "NO_ROUTE", null, "feasibility"); return; }
    }
    const segmentId = runtime.segments[runtime.cursor];
    const edge = run.scenario.routing.edges.find(edge => edge.id === segmentId);
    if (!edge || edge.from !== driver.position.node_id || !edge.vehicles.includes(driver.vehicle_type)) {
      wait(run, id, driver, "NO_ROUTE", segmentId ?? null, "feasibility"); return;
    }
    const turnBanned = run.scenario.routing.turnBans.some(ban => ban.incoming === runtime.incoming && ban.outgoing === edge.id && ban.vehicles.includes(driver.vehicle_type));
    const profile = edge.travel[driver.vehicle_type]!;
    const decision = checkEntry(run, id, driver, edge.id, run.nowMs, policy);
    if (turnBanned || !isTravelTimeAvailable(profile, run.nowMs) || !decision.allowed) {
      wait(run, id, driver, turnBanned ? "POL-04:TURN" : !decision.allowed ? decision.reason : "PROFILE_UNAVAILABLE", edge.id, !decision.allowed || turnBanned ? "road" : "feasibility"); return;
    }
    const exitMs = run.nowMs + travelDurationMs(profile, run.nowMs);
    driver.position = { kind: "on_edge", node_id: null, segment_id: edge.id,
      entered_sim_minute: millisecondsToMinutes(run.nowMs), exit_sim_minute: millisecondsToMinutes(exitMs) };
    driver.status = "moving"; runtime.cursor++;
    appendLog(run, id, "entry", { driverId: driver.driver_id, segmentId: edge.id });
    return;
  }
  throw new Error("SIMULATION_BOUNDARY_BUDGET_EXCEEDED");
}
