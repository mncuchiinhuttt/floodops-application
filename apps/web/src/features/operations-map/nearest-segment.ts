import type { Graph } from "@floodops/contracts";

export interface NearestSegment { segmentId: string; meters: number }
const EARTH_M = 6_371_000;
/** Equirectangular metres from a point to a [lon, lat] segment; accurate to well under 1% at city scale. */
function metersToEdge(lon: number, lat: number, a: readonly number[], b: readonly number[]): number {
  const scale = Math.cos(lat * Math.PI / 180), k = Math.PI / 180 * EARTH_M;
  const px = lon * scale * k, py = lat * k;
  const ax = a[0]! * scale * k, ay = a[1]! * k, bx = b[0]! * scale * k, by = b[1]! * k;
  const dx = bx - ax, dy = by - ay, span = dx * dx + dy * dy;
  const t = span === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / span));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
/** The road segment of the scenario graph closest to a WGS84 point, or null when the graph has no geometry. */
export function nearestSegment(graph: Graph, lon: number, lat: number): NearestSegment | null {
  let best: NearestSegment | null = null;
  for (const segment of graph.segments) {
    for (let index = 1; index < segment.polyline.length; index++) {
      const meters = metersToEdge(lon, lat, segment.polyline[index - 1]!, segment.polyline[index]!);
      if (!best || meters < best.meters) best = { segmentId: segment.segment_id, meters };
    }
  }
  return best;
}
