import type { Graph, VehicleType } from "@floodops/contracts";
import { createGraph, polylineLengthMeters } from "../graph/index.ts";
import type { TurnBan } from "../graph/index.ts";
import { minutesToMilliseconds } from "../clock/index.ts";

/** Wire profiles are constant over explicit [from,until) windows, never interpolated. */
export function compileWireGraph(graph: Graph, horizonMs: number, lengthToleranceMeters: number) {
  const turnBans: TurnBan[] = [], banKeys = new Set<string>(), only = new Map<string, string>();
  for (const segment of graph.segments) for (const restriction of segment.turn_restrictions) {
    const from = graph.segments.find(item => item.segment_id === restriction.from_segment_id);
    const to = graph.segments.find(item => item.segment_id === restriction.to_segment_id);
    if (!from || !to || from.segment_id !== segment.segment_id || from.to_node_id !== to.from_node_id) throw new Error("Invalid turn adjacency/owner.");
    for (const vehicle of restriction.vehicle_types) {
      if (!from.allowed_vehicle_types.includes(vehicle) || !to.allowed_vehicle_types.includes(vehicle)) throw new Error("Turn vehicle mismatch.");
      const key = JSON.stringify([from.segment_id, vehicle]);
      if (restriction.kind === "only_turn") {
        if (only.has(key) && only.get(key) !== to.segment_id) throw new Error("Conflicting only-turn restrictions.");
        only.set(key, to.segment_id);
      }
    }
  }
  for (const segment of graph.segments) for (const vehicle of segment.allowed_vehicle_types) {
    const target = only.get(JSON.stringify([segment.segment_id, vehicle]));
    for (const outgoing of graph.segments.filter(edge => edge.from_node_id === segment.to_node_id && edge.allowed_vehicle_types.includes(vehicle))) {
      const noTurn = segment.turn_restrictions.some(turn => turn.kind === "no_turn" && turn.to_segment_id === outgoing.segment_id && turn.vehicle_types.includes(vehicle));
      if (target === outgoing.segment_id && noTurn) throw new Error("Only-turn conflicts with no-turn.");
      if (noTurn || (target !== undefined && outgoing.segment_id !== target)) {
        const key = JSON.stringify([segment.segment_id, outgoing.segment_id, vehicle]);
        if (!banKeys.has(key)) turnBans.push({ incoming: segment.segment_id, outgoing: outgoing.segment_id, vehicles: [vehicle] });
        banKeys.add(key);
      }
    }
  }
  return createGraph({ nodes: graph.nodes.map(node => ({ id: node.node_id, coordinate: node.coordinate })), turnBans,
    edges: graph.segments.map(segment => {
      if (Math.abs(polylineLengthMeters(segment.polyline) - segment.length_m) > lengthToleranceMeters) throw new Error("Geometry length outside declared tolerance.");
      const travel: Partial<Record<VehicleType, {validFromMs: number; validUntilMs: number | null; durationMs: number}[]>> = {};
      for (const vehicle of segment.allowed_vehicle_types) {
        const windows = segment.travel_profiles.filter(profile => profile.vehicle_type === vehicle)
          .sort((a, b) => a.valid_from_minute - b.valid_from_minute).map(profile => ({
            validFromMs: minutesToMilliseconds(profile.valid_from_minute),
            validUntilMs: profile.valid_until_minute === null ? null : minutesToMilliseconds(profile.valid_until_minute),
            durationMs: minutesToMilliseconds(profile.travel_time_minute) }));
        const end = windows.at(-1)?.validUntilMs;
        if (!windows.length || (end !== null && (end === undefined || end < horizonMs))) throw new Error("Travel profile lacks horizon coverage.");
        travel[vehicle] = windows;
      }
      if (segment.travel_profiles.some(profile => !segment.allowed_vehicle_types.includes(profile.vehicle_type))) throw new Error("Profile for disallowed vehicle.");
      return { id: segment.segment_id, from: segment.from_node_id, to: segment.to_node_id,
        geometry: segment.polyline, vehicles: segment.allowed_vehicle_types, travel };
    }) });
}
