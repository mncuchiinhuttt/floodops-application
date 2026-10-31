import type { Coordinate, GraphEdge, GraphInput, GraphNode, Vehicle } from "../../src/graph/index.ts";

export function node(id: string, longitude: number, latitude = 0): GraphNode {
  return { id, coordinate: [longitude, latitude] };
}
export function edge(id: string, from: GraphNode, to: GraphNode, durationMs: number,
  vehicles: readonly Vehicle[] = ["motorbike", "car"]): GraphEdge {
  return { id, from: from.id, to: to.id, geometry: [from.coordinate, to.coordinate], vehicles,
    travel: Object.fromEntries(vehicles.map(vehicle => [vehicle, [{ departureMs: 0, durationMs }]])) };
}
export function graphFixture(): GraphInput {
  const a = node("A", 0), b = node("B", 0.001), c = node("C", 0, 0.001), d = node("D", 0.002);
  return { nodes: [a, b, c, d], edges: [edge("AB", a, b, 1), edge("AC", a, c, 2),
    edge("CB", c, b, 2), edge("BD", b, d, 1), edge("AD-bike", a, d, 1, ["motorbike"])],
  turnBans: [{ incoming: "AB", outgoing: "BD", vehicles: ["car"] }] };
}
export function bentGeometry(): readonly Coordinate[] { return [[0, 0], [0, 1], [1, 1]]; }
