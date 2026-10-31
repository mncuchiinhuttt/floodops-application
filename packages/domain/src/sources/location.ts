import { CoordinateSchema } from "@floodops/contracts";
import type { Coordinate, Graph, VehicleType } from "@floodops/contracts";
import { fail } from "./source-types.ts";

const radians = (degrees: number) => degrees * Math.PI / 180;
const vector = ([lon, lat]: Coordinate) => [Math.cos(radians(lat)) * Math.cos(radians(lon)),
  Math.cos(radians(lat)) * Math.sin(radians(lon)), Math.sin(radians(lat))];
const dot = (a: number[], b: number[]) => a.reduce((sum, item, index) => sum + item * b[index]!, 0);
const cross = (a: number[], b: number[]) => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
const norm = (a: number[]) => Math.hypot(...a);
const angle = (a: number[], b: number[]) => Math.atan2(norm(cross(a, b)), dot(a, b));

/** Shortest distance to a minor great-circle polyline, WGS84 coordinates in metres. */
export function distanceToPolyline(point: Coordinate, line: readonly Coordinate[]): number {
  if (!CoordinateSchema.safeParse(point).success || line.length < 2 || line.some(item => !CoordinateSchema.safeParse(item).success)) fail("INVALID_SCHEMA");
  const p = vector(point);
  let distance = Infinity;
  for (let i = 1; i < line.length; i++) {
    const a = vector(line[i - 1]!), b = vector(line[i]!), normal = cross(a, b), size = norm(normal);
    let arc = Math.min(angle(p, a), angle(p, b));
    if (size > 0) {
      const unit = normal.map(item => item / size), offset = dot(p, unit);
      const projected = p.map((item, index) => item - offset * unit[index]!);
      if (norm(projected) > 0) {
        const q = projected.map(item => item / norm(projected));
        if (dot(cross(a, q), normal) >= 0 && dot(cross(q, b), normal) >= 0) arc = angle(p, q);
      }
    }
    distance = Math.min(distance, arc * 6_371_000);
  }
  return distance;
}
export function resolveReportLocation(input: { segment_id: string | null; coordinate: Coordinate | null; vehicle_types: VehicleType[] },
  graph: Graph, tolerance: number | null): string {
  if (tolerance === null || !Number.isFinite(tolerance) || tolerance < 0) fail("CONFIG_INCOMPLETE");
  if (input.coordinate === null) fail("NEEDS_CLARIFICATION");
  const candidates = graph.segments.filter(edge => distanceToPolyline(input.coordinate!, edge.polyline) <= tolerance);
  if (input.segment_id !== null && !graph.segments.some(edge => edge.segment_id === input.segment_id)) fail("UNKNOWN_SEGMENT");
  const matches = candidates.filter(edge => input.segment_id === null || edge.segment_id === input.segment_id);
  if (!matches.length) fail("LOCATION_MISMATCH");
  if (matches.length !== 1) fail("NEEDS_CLARIFICATION");
  const edge = matches[0]!;
  if (!input.vehicle_types.length || input.vehicle_types.some(vehicle => !edge.allowed_vehicle_types.includes(vehicle))) fail("NEEDS_CLARIFICATION");
  return edge.segment_id;
}
