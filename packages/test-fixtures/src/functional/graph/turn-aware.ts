/** Original synthetic geometry and assumed times, solely for functional algorithm checks. */
export function createTurnAwareFixture() {
  const point = (longitude: number, latitude: number): readonly [number, number] => [longitude, latitude];
  const nodes = [
    { id: "A", coordinate: point(106.70, 10.77) },
    { id: "B", coordinate: point(106.701, 10.77) },
    { id: "C", coordinate: point(106.70, 10.771) },
    { id: "D", coordinate: point(106.702, 10.77) }
  ];
  const coordinate = (id: string) => nodes.find(node => node.id === id)!.coordinate;
  const vehicles = ["motorbike", "car"] as const;
  const edge = (id: string, from: string, to: string, durationMs: number, motorbikeOnly = false) => ({
    id, from, to, geometry: [coordinate(from), coordinate(to)],
    vehicles: motorbikeOnly ? ["motorbike"] as const : vehicles,
    travel: motorbikeOnly ? { motorbike: [{ departureMs: 0, durationMs }] }
      : { motorbike: [{ departureMs: 0, durationMs }], car: [{ departureMs: 0, durationMs }] }
  });
  return {
    metadata: {
      id: "synthetic-turn-aware-v1", datasetKind: "functional_fixture", calibrationStatus: "incomplete",
      provenance: "Original synthetic WGS84 coordinates and assumed millisecond durations; no real road data.",
      licence: "Project-authored synthetic fixture", randomSeed: null
    },
    graph: { nodes, edges: [edge("AB", "A", "B", 1000), edge("AC", "A", "C", 2000),
      edge("CB", "C", "B", 2000), edge("BD", "B", "D", 1000), edge("AD-bike", "A", "D", 500, true)],
    turnBans: [{ incoming: "AB", outgoing: "BD", vehicles }] }
  };
}
