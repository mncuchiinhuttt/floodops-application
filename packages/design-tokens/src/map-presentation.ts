import { tokens } from "./tokens.native";
import type { MapLine, MapPoint, MapPresentation } from "./presentation";
export function mapPath(points: readonly MapPoint[]): string {
  if (points.length < 2 || points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
    throw new RangeError("Map lines need at least two finite display points.");
  }
  return points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" ");
}
export function assertMapPresentation(scene: MapPresentation): void {
  if (!scene.title.trim() || !scene.scaleLabel.trim() || !scene.vehicleLabel.trim()) throw new Error("Maps require title, scale and vehicle labels.");
  if (!Number.isFinite(scene.width) || !Number.isFinite(scene.height) || scene.width <= 0 || scene.height <= 0) {
    throw new RangeError("Map extents must be positive finite display coordinates.");
  }
  const points = [...scene.markers, ...scene.lines.flatMap(line => { mapPath(line.points); return line.points; })];
  if (points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.y < 0 || point.x > scene.width || point.y > scene.height)) {
    throw new RangeError("Map points must be finite and inside the supplied view box.");
  }
}
export function mapLineStyle(line: Pick<MapLine, "state">): { color: string; dash: string | undefined } {
  const tone = line.state.tone;
  if (tone === "closed" || tone === "congestion" || tone === "unknown") {
    const road = tokens.semantic.map.road[tone];
    return { color: road.color, dash: road.dash };
  }
  const pair = tokens.semantic.status[tone];
  const dash: Record<string, string | undefined> = { solid: undefined, dashed: "8 4", dotted: "1 4", crosshatch: "2 2 8 2", double: "10 2" };
  return { color: pair.border, dash: dash[pair.pattern] };
}
export function mapRouteStyle(route: "primary" | "alternative" | undefined): { color: string; dash: string | undefined } | undefined {
  if (!route) return undefined;
  const style = tokens.semantic.map.route[route];
  return { color: style.color, dash: style.dash === "none" ? undefined : style.dash };
}
