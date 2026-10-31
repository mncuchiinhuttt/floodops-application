import { assertMapPresentation, mapLineStyle, mapPath, mapRouteStyle, tokens } from "@floodops/design-tokens";
import type { MapMarker, MapPresentation, RoutePresentation } from "@floodops/design-tokens";
import { Icon } from "@floodops/icons/web";
import { Button } from "../primitives/button";
import { Card } from "../primitives/content";
import { StatusBadge } from "../primitives/badge";

export function MapEntityMarker({ marker, onSelect }: { marker: MapMarker; onSelect?: (id: string) => void }) {
  if (!marker.label.trim()) throw new Error("Map markers require visible labels.");
  const content = <><Icon name={marker.kind} decorative />{marker.label}</>;
  return onSelect ? <Button variant="secondary" onClick={() => onSelect(marker.id)} aria-label={marker.label}>{content}</Button>
    : <span className="inline-flex items-center gap-2">{content}</span>;
}
export function MapLegend() {
  return <section aria-label="Map legend" className="grid gap-2"><h3 className="m-0 text-sm font-semibold">Map legend</h3>
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
      {(["closed", "congestion", "unknown", "conflict"] as const).map(tone => { const style = mapLineStyle({ state: { tone, label: tone } }); return <li key={tone} className="inline-flex items-center gap-2">
        <svg width="48" height="12" aria-hidden="true"><path d="M0 6H48" fill="none" stroke={style.color} strokeDasharray={style.dash} strokeWidth={3} /></svg>
        <StatusBadge tone={tone} label={{ closed: "Closed", congestion: "Congestion", unknown: "Unknown", conflict: "Conflict" }[tone]} />
      </li>; })}
    </ul>
    <ul className="m-0 grid list-none gap-0.5 p-0 text-xs text-muted-foreground"><li>Outer stroke: segment state</li><li>Thin inner stroke: route display</li><li>Solid inner line: primary route</li><li>Dashed line: alternative route</li></ul>
    <p className="m-0 text-xs text-muted-foreground">Route display does not grant approval or prove passability.</p></section>;
}
export function MapCanvas({ scene, onSelectMarker }: { scene: MapPresentation; onSelectMarker?: (id: string) => void }) {
  assertMapPresentation(scene);
  return <Card title={scene.title}><figure className="fo-map"><svg viewBox={`0 0 ${scene.width} ${scene.height}`} role="img" aria-label={`${scene.title}. Detailed segment and marker lists follow.`}>
    {scene.lines.map(line => { const style = mapLineStyle(line); const route = mapRouteStyle(line.route); const path = mapPath(line.points); return <g key={line.id}>
      <path d={path} fill="none" stroke={style.color} strokeDasharray={style.dash} strokeWidth={route ? 8 : 3} />
      {route && <><path d={path} fill="none" stroke={tokens.semantic.surface.panel} strokeWidth={4} />
        <path d={path} fill="none" stroke={route.color} strokeDasharray={route.dash} strokeWidth={2} /></>}
    </g>; })}
    {scene.markers.map(marker => <circle key={marker.id} cx={marker.x} cy={marker.y} r={4} fill={tokens.semantic.action.primary.bg} />)}
  </svg><figcaption className="mt-2 text-xs text-muted-foreground">Scale: {scene.scaleLabel} · Vehicle scope: {scene.vehicleLabel}</figcaption></figure>
    <MapLegend />
    <ol aria-label="Map segments" className="m-0 grid list-none gap-2 p-0">{scene.lines.map(line => <li key={line.id} className="grid gap-1 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2"><strong className="font-medium">{line.label}</strong> <StatusBadge {...line.state} /></div>
      <p className="m-0 text-muted-foreground">{line.detail}</p></li>)}</ol>
    <ul aria-label="Map markers" className="m-0 flex list-none flex-wrap gap-2 p-0">{scene.markers.map(marker => <li key={marker.id}><MapEntityMarker marker={marker} onSelect={onSelectMarker} /></li>)}</ul>
  </Card>;
}
export function RouteSummary({ route }: { route: RoutePresentation }) {
  return <Card title={route.title}><p className="m-0 text-xs text-muted-foreground">{route.phase === "projected" ? "Projected" : "Committed"} route</p>
    <p className="m-0 font-medium tabular-nums">Simulation ETA: {route.etaLabel ?? "Unavailable"}</p><p className="m-0 text-muted-foreground">{route.detail}</p>
    {route.segments.length ? <ol className="m-0 grid gap-1 pl-5">{route.segments.map((label, index) => <li key={index}>{label}</li>)}</ol> : <p className="m-0 text-muted-foreground">No route segments</p>}
  </Card>;
}
