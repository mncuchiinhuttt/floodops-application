import { RouteSchema } from "@floodops/contracts";
import type { Route } from "@floodops/contracts";
import type { HashText } from "../scenario/scenario-types.ts";
import { canonicalJson } from "../scenario/fingerprint.ts";
import type { SimulationCandidate, SimulationPolicy, SimulationRun } from "../movement/run-types.ts";
import { prepareCandidate, projectCurrent } from "./project-candidate.ts";
import { routeStops } from "../movement/route-stops.ts";
import { millisecondsToMinutes } from "../clock/index.ts";

export function computeRoute(input: SimulationRun, candidate: SimulationCandidate, driverId: string, policy: SimulationPolicy,
  context: { routeId: string; inputRevision: number; hash: HashText }): Route {
  const run = prepareCandidate(input, candidate, policy), branch = run.branches.floodops!;
  const driver = branch.operations.drivers.find(item => item.driver_id === driverId);
  if (!driver || driver.position.kind !== "node") throw new Error("Unknown/busy route driver.");
  const routed = routeStops(run, "floodops", driver, driver.ordered_stops, policy);
  const finalStop = driver.ordered_stops.at(-1);
  const eta = !routed ? null : finalStop ? projectCurrent(run, policy).etas[finalStop.order_id] ?? null : millisecondsToMinutes(run.nowMs);
  const segments = routed && eta !== null ? routed.segments : [];
  return RouteSchema.parse({ route_id: context.routeId, driver_id: driverId, input_revision: context.inputRevision,
    segment_ids: segments, stops: driver.ordered_stops, eta_minute: eta,
    evidence_ids: [...new Set(run.knowledge.filter(item => segments.includes(item.segment_id) && item.vehicle_type === driver.vehicle_type).flatMap(item => item.observation_ids))],
    unknown_segment_ids: segments.length ? segments.filter(id => !run.knowledge.some(item => item.segment_id === id && item.vehicle_type === driver.vehicle_type && item.state === "known" && item.confidence_band === "high")) : [],
    status: routed && eta !== null ? "candidate" : "no_route", distance_m: segments.reduce((sum, id) => sum + run.scenario.routing.edges.find(edge => edge.id === id)!.lengthMeters, 0),
    candidate_context_hash: context.hash(canonicalJson({ operations: branch.operations, candidate })),
    origin_node_id: driver.position.node_id, assignment_overrides: candidate.assignments });
}
