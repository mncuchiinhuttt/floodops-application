import type { Coordinate, Graph } from "@floodops/contracts";
export interface MetricPoint { x: number; y: number }
export interface MetricView extends MetricPoint { width: number; height: number }
/** Local equirectangular display plane, metres, north up; not a calibrated routing distance. */
export function createProjection(graph: Graph, extra: readonly Coordinate[] = []) {
  const coordinates = [...graph.nodes.map(node => node.coordinate), ...graph.segments.flatMap(segment => segment.polyline), ...extra];
  if (!coordinates.length) return null;
  if (coordinates.some(([lon, lat]) => !Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90)) throw new RangeError("Invalid WGS84 geometry");
  const lons = coordinates.map(point => point[0]), lats = coordinates.map(point => point[1]);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons), minLat = Math.min(...lats), maxLat = Math.max(...lats);
  if (maxLon - minLon > 5 || maxLat - minLat > 5) throw new RangeError("Geometry exceeds local map projection extent");
  const radians = Math.PI / 180, radius = 6371008.8;
  const origin: Coordinate = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
  const project = ([lon, lat]: Coordinate): MetricPoint => ({ x: radius * (lon - origin[0]) * radians * Math.cos(origin[1] * radians), y: -radius * (lat - origin[1]) * radians });
  const points = coordinates.map(project), minX = Math.min(...points.map(point => point.x)), maxX = Math.max(...points.map(point => point.x));
  const minY = Math.min(...points.map(point => point.y)), maxY = Math.max(...points.map(point => point.y));
  const span = Math.max(maxX - minX, (maxY - minY) * 2);
  if (span < 0.000001) return null;
  const width = span * 1.12, height = width / 2;
  const fit: MetricView = { x: (minX + maxX - width) / 2, y: (minY + maxY - height) / 2, width, height };
  return { project, fit };
}
export function zoomedView(fit: MetricView, zoom: number, pan: MetricPoint): MetricView {
  const width = fit.width / zoom, height = fit.height / zoom;
  return { x: fit.x + (fit.width - width) / 2 + pan.x, y: fit.y + (fit.height - height) / 2 + pan.y, width, height };
}
export function scaleLength(width: number): number {
  const target = width / 5, unit = 10 ** Math.floor(Math.log10(target));
  return [5, 2, 1].map(value => value * unit).find(value => value <= target) ?? unit;
}
