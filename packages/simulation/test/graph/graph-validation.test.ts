import { expect, test } from "bun:test";
import { createGraph } from "../../src/graph/index.ts";
import { edge, graphFixture, node } from "./graph-builder.ts";

test("graph requires valid references, access, unique IDs and directed geometry endpoints", () => {
  const fixture = graphFixture(), first = fixture.edges[0]!;
  const invalid = [
    { ...fixture, nodes: [...fixture.nodes, fixture.nodes[0]!] },
    { ...fixture, edges: [...fixture.edges, first] },
    { ...fixture, edges: [{ ...first, from: "missing" }] },
    { ...fixture, edges: [{ ...first, geometry: [...first.geometry].reverse() }] },
    { ...fixture, edges: [{ ...first, geometry: [fixture.nodes[0]!.coordinate, fixture.nodes[0]!.coordinate] }] },
    { ...fixture, edges: [{ ...first, vehicles: [] }] },
    { ...fixture, edges: [{ ...first, vehicles: ["car", "car"] as const }] },
    { ...fixture, edges: [{ ...first, travel: { car: first.travel.car } }] },
    { ...fixture, turnBans: [{ incoming: "missing", outgoing: "BD", vehicles: ["car"] as const }] },
    { ...fixture, turnBans: [{ incoming: "AC", outgoing: "AB", vehicles: ["car"] as const }] },
    { ...fixture, turnBans: [...fixture.turnBans, fixture.turnBans[0]!] }
  ];
  for (const input of invalid) expect(() => createGraph(input)).toThrow();
  const a = node("A", 0), b = node("B", 1);
  const bike = edge("bike", a, b, 10, ["motorbike"]);
  expect(() => createGraph({ nodes: [a, b], edges: [{ ...bike, travel: { ...bike.travel, car: [{ departureMs: 0, durationMs: 1 }] } }], turnBans: [] })).toThrow();
});

test("compiled graph is detached from mutable caller data and deeply frozen", () => {
  const coordinate: [number, number] = [0, 0];
  const profile = [{ departureMs: 0, durationMs: 10 }];
  const a = { id: "A", coordinate }, b = node("B", 1);
  const source = { nodes: [a, b], edges: [{ ...edge("AB", a, b, 10), travel: { car: profile, motorbike: profile } }], turnBans: [] };
  const graph = createGraph(source);
  coordinate[0] = 42;
  profile[0]!.durationMs = 999;
  source.nodes.reverse();
  expect(graph.nodes[0]!.coordinate).toEqual([0, 0]);
  expect(graph.edges[0]!.travel.car![0]!.durationMs).toBe(10);
  for (const value of [graph, graph.nodes, graph.nodes[0], graph.nodes[0]!.coordinate,
    graph.edges, graph.edges[0], graph.edges[0]!.travel, graph.edges[0]!.travel.car, graph.edges[0]!.travel.car![0]]) {
    expect(Object.isFrozen(value)).toBe(true);
  }
});
