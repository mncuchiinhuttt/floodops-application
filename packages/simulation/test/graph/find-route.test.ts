import { expect, test } from "bun:test";
import { createGraph, findRoute } from "../../src/graph/index.ts";
import { edge, graphFixture, node } from "./graph-builder.ts";

const query = { from: "A", to: "D", vehicle: "car", departureMs: 0 } as const;

test("retains incoming edge state; car takes valid later arrival while motorbike takes own edge", () => {
  const graph = createGraph(graphFixture());
  const car = findRoute(graph, query)!;
  expect(car.edgeIds).toEqual(["AC", "CB", "BD"]);
  expect(car.arrivalMs).toBe(5);
  expect(car.legs.map(leg => [leg.enteredAtMs, leg.exitedAtMs])).toEqual([[0, 2], [2, 4], [4, 5]]);
  expect(car.lengthMeters).toBeCloseTo(graph.edges.filter(e => car.edgeIds.includes(e.id)).reduce((sum, e) => sum + e.lengthMeters, 0), 8);
  expect(findRoute(graph, { ...query, vehicle: "motorbike" })!.edgeIds).toEqual(["AD-bike"]);
  expect(findRoute(graph, { ...query, from: "B", incomingEdgeId: "AB" })).toBeNull();
  expect(findRoute(graph, { ...query, from: "B" })!.edgeIds).toEqual(["BD"]);
});

test("respects directed reachability and validates query; zero-hop route is explicit", () => {
  const graph = createGraph(graphFixture());
  expect(findRoute(graph, { ...query, from: "D", to: "A" })).toBeNull();
  expect(findRoute(graph, { ...query, to: "A", departureMs: 20 })).toEqual({ edgeIds: [], legs: [], departureMs: 20, arrivalMs: 20, lengthMeters: 0 });
  expect(() => findRoute(graph, { ...query, to: "missing" })).toThrow();
  expect(() => findRoute(graph, { ...query, incomingEdgeId: "CB" })).toThrow();
  expect(() => findRoute(graph, { ...query, departureMs: Number.MAX_SAFE_INTEGER })).toThrow();
});

test("evaluates time profiles at each edge entry and changes best path by departure", () => {
  const a = node("A", 0), b = node("B", 1), d = node("D", 2);
  const bd = { ...edge("BD", b, d, 1), travel: { car: [{ departureMs: 0, durationMs: 1 },
    { departureMs: 10, durationMs: 11 }] } , vehicles: ["car"] as const };
  const graph = createGraph({ nodes: [a, b, d], edges: [edge("AB", a, b, 5), bd, edge("AD", a, d, 15)], turnBans: [] });
  expect(findRoute(graph, query)!.arrivalMs).toBe(11);
  expect(findRoute(graph, { ...query, departureMs: 10 })!.edgeIds).toEqual(["AD"]);
  expect(findRoute(graph, { ...query, departureMs: 10 })!.arrivalMs).toBe(25);
});

test("equal-arrival routing is deterministic under input permutation", () => {
  const a = node("A", 0), b = node("B", 1), c = node("C", 0, 1), d = node("D", 2);
  const input = { nodes: [a, b, c, d], edges: [edge("AB", a, b, 1), edge("BD", b, d, 1), edge("AC", a, c, 1), edge("CD", c, d, 1)], turnBans: [] };
  const expected = findRoute(createGraph(input), query);
  for (let rotation = 0; rotation < input.edges.length; rotation++) {
    const edges = [...input.edges.slice(rotation), ...input.edges.slice(0, rotation)].reverse();
    expect(findRoute(createGraph({ ...input, nodes: [...input.nodes].reverse(), edges }), query)).toEqual(expected);
  }
});

test("parallel paths choose earliest physical arrival across a range of costs", () => {
  const a = node("A", 0), b = node("B", 1), d = node("D", 2);
  for (let first = 1; first <= 10; first++) for (let second = 1; second <= 10; second++) {
    const graph = createGraph({ nodes: [a, b, d], edges: [edge("AB", a, b, first), edge("BD", b, d, second), edge("AD", a, d, 12)], turnBans: [] });
    expect(findRoute(graph, query)!.arrivalMs).toBe(Math.min(first + second, 12));
  }
});
