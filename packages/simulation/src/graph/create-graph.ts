import { assertCoordinate, polylineLengthMeters } from "./geometry.ts";
import type { Coordinate, GraphInput, RoutingGraph, Vehicle } from "./graph-types.ts";
import { validateTravelProfile } from "./travel-profile.ts";

function assertId(id: string, seen: Set<string>): void {
  if (!id.trim() || seen.has(id)) throw new Error("Graph IDs must be nonempty and unique.");
  seen.add(id);
}
function vehiclesValid(vehicles: readonly Vehicle[]): void {
  if (!vehicles.length || new Set(vehicles).size !== vehicles.length
    || vehicles.some(vehicle => vehicle !== "motorbike" && vehicle !== "car")) {
    throw new Error("Explicit unique supported vehicles required.");
  }
}
function copyCoordinate(coordinate: Coordinate): Coordinate {
  assertCoordinate(coordinate);
  return Object.freeze([coordinate[0], coordinate[1]]);
}
const samePoint = (a: Coordinate, b: Coordinate) => a[0] === b[0] && a[1] === b[1];

export function createGraph(input: GraphInput): RoutingGraph {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const nodes = input.nodes.map(node => {
    assertId(node.id, nodeIds);
    return Object.freeze({ id: node.id, coordinate: copyCoordinate(node.coordinate) });
  });
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const edges = input.edges.map(edge => {
    assertId(edge.id, edgeIds);
    vehiclesValid(edge.vehicles);
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) throw new Error("Edge references an unknown node.");
    const geometry = Object.freeze(edge.geometry.map(copyCoordinate));
    const lengthMeters = polylineLengthMeters(geometry);
    if (!lengthMeters || !samePoint(geometry[0]!, from.coordinate)
      || !samePoint(geometry[geometry.length - 1]!, to.coordinate)) {
      throw new Error("Edge geometry must have positive length and exact directed endpoints.");
    }
    for (const vehicle of Object.keys(edge.travel)) {
      if (!edge.vehicles.includes(vehicle as Vehicle)) throw new Error("Profile for disallowed vehicle.");
    }
    const travel = Object.fromEntries(edge.vehicles.map(vehicle => {
      const profile = edge.travel[vehicle];
      if (!profile) throw new Error("Missing allowed vehicle travel profile.");
      validateTravelProfile(profile);
      return [vehicle, Object.freeze(profile.map(point => Object.freeze({ ...point })))];
    }));
    return Object.freeze({ id: edge.id, from: edge.from, to: edge.to, geometry,
      vehicles: Object.freeze([...edge.vehicles]), travel: Object.freeze(travel), lengthMeters });
  });
  const edgeById = new Map(edges.map(edge => [edge.id, edge]));
  const banKeys = new Set<string>();
  const turnBans = input.turnBans.map(ban => {
    vehiclesValid(ban.vehicles);
    const incoming = edgeById.get(ban.incoming);
    const outgoing = edgeById.get(ban.outgoing);
    if (!incoming || !outgoing || incoming.to !== outgoing.from) throw new Error("Invalid turn reference.");
    for (const vehicle of ban.vehicles) {
      if (!incoming.vehicles.includes(vehicle) || !outgoing.vehicles.includes(vehicle)) {
        throw new Error("Turn vehicle must be compatible with both edges.");
      }
      const key = JSON.stringify([ban.incoming, ban.outgoing, vehicle]);
      if (banKeys.has(key)) throw new Error("Duplicate turn ban.");
      banKeys.add(key);
    }
    return Object.freeze({ ...ban, vehicles: Object.freeze([...ban.vehicles]) });
  });
  return Object.freeze({ nodes: Object.freeze(nodes), edges: Object.freeze(edges), turnBans: Object.freeze(turnBans) });
}
