import type { Route, RouteLeg, RouteQuery, RoutingGraph } from "./graph-types.ts";
import { assertMilliseconds, travelDurationMs, isTravelTimeAvailable } from "./travel-profile.ts";

interface Label {
  node: string;
  incoming: string | null;
  atMs: number;
  legs: readonly RouteLeg[];
  lengthMeters: number;
}
const stateKey = (node: string, incoming: string | null) => JSON.stringify([node, incoming]);
const compareText = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Earliest arrival on a validated FIFO graph; no evidence/Execute authorization implied. */
export function findRoute(graph: RoutingGraph, query: RouteQuery,
  canEnter: (edgeId: string, atMs: number) => boolean = () => true): Route | null {
  assertMilliseconds(query.departureMs);
  if (query.vehicle !== "motorbike" && query.vehicle !== "car" && query.vehicle !== "truck") throw new Error("Unknown vehicle.");
  if (![query.from, query.to].every(id => graph.nodes.some(node => node.id === id))) {
    throw new Error("Unknown route endpoint.");
  }
  if (query.incomingEdgeId !== undefined) {
    const incoming = graph.edges.find(edge => edge.id === query.incomingEdgeId);
    if (!incoming || incoming.to !== query.from || !incoming.vehicles.includes(query.vehicle)) {
      throw new Error("Incoming edge must end at the route origin and support the vehicle.");
    }
  }
  const outgoing = new Map<string, typeof graph.edges[number][]>();
  for (const edge of graph.edges) outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
  for (const edges of outgoing.values()) edges.sort((a, b) => compareText(a.id, b.id));
  const queue: Label[] = [{ node: query.from, incoming: query.incomingEdgeId ?? null,
    atMs: query.departureMs, legs: [], lengthMeters: 0 }];
  const best = new Map<string, number>([[stateKey(query.from, query.incomingEdgeId ?? null), query.departureMs]]);
  while (queue.length) {
    queue.sort((a, b) => a.atMs - b.atMs || compareText(stateKey(a.node, a.incoming), stateKey(b.node, b.incoming)));
    const current = queue.shift()!;
    if (best.get(stateKey(current.node, current.incoming)) !== current.atMs) continue;
    if (current.node === query.to) return Object.freeze({ departureMs: query.departureMs,
      arrivalMs: current.atMs, lengthMeters: current.lengthMeters,
      edgeIds: Object.freeze(current.legs.map(leg => leg.edgeId)), legs: Object.freeze(current.legs) });
    for (const edge of outgoing.get(current.node) ?? []) {
      if (!edge.vehicles.includes(query.vehicle) || graph.turnBans.some(ban =>
        ban.incoming === current.incoming && ban.outgoing === edge.id && ban.vehicles.includes(query.vehicle))) continue;
      const profile = edge.travel[query.vehicle]!;
      if (!isTravelTimeAvailable(profile, current.atMs) || !canEnter(edge.id, current.atMs)) continue;
      const atMs = current.atMs + travelDurationMs(profile, current.atMs);
      assertMilliseconds(atMs);
      const key = stateKey(edge.to, edge.id);
      if (atMs >= (best.get(key) ?? Infinity)) continue;
      best.set(key, atMs);
      queue.push({ node: edge.to, incoming: edge.id, atMs, lengthMeters: current.lengthMeters + edge.lengthMeters,
        legs: [...current.legs, Object.freeze({ edgeId: edge.id, enteredAtMs: current.atMs, exitedAtMs: atMs })] });
    }
  }
  return null;
}
