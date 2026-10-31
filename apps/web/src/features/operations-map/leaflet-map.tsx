import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@floodops/ui-web";

export type LonLat = readonly [number, number];
export interface MapLine { id: string; points: readonly LonLat[]; color: string; dash?: string; weight?: number; title?: string }
export interface MapPin { id: string; at: LonLat; label: string; tone?: "pick" | "entity" }
export interface LeafletMapProps {
  label: string; lines: readonly MapLine[]; pins?: readonly MapPin[]; className?: string;
  onLineClick?: (id: string, at: LonLat) => void; onMapClick?: (at: LonLat) => void;
  /** Changing this re-fits the view to the lines; edits to lines alone keep the user's pan and zoom. */
  fitKey?: string;
}
const toLatLng = (point: LonLat): L.LatLngTuple => [point[1], point[0]];
const pinIcon = (tone: MapPin["tone"]) => L.divIcon({ className: "", iconSize: [20, 20], iconAnchor: [10, 10], html: `<span class="fo-pin" data-tone="${tone ?? "entity"}"></span>` });
/** OpenStreetMap raster basemap with the scenario's road geometry on top. Tiles need a Referer, hence referrerPolicy "origin". */
export function LeafletMap({ label, lines, pins = [], className, onLineClick, onMapClick, fitKey = "" }: LeafletMapProps) {
  const host = useRef<HTMLDivElement>(null), map = useRef<L.Map | null>(null), layer = useRef<L.LayerGroup | null>(null), fitted = useRef<string | null>(null);
  const handlers = useRef({ onLineClick, onMapClick });
  handlers.current = { onLineClick, onMapClick };
  useEffect(() => {
    if (!host.current) return;
    const created = L.map(host.current, { center: [10.77, 106.7], zoom: 15, zoomControl: true, attributionControl: true, keyboard: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, referrerPolicy: "origin",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors' }).addTo(created);
    created.on("click", event => handlers.current.onMapClick?.([event.latlng.lng, event.latlng.lat]));
    layer.current = L.layerGroup().addTo(created); map.current = created;
    return () => { created.remove(); map.current = null; layer.current = null; fitted.current = null; };
  }, []);
  useEffect(() => {
    const group = layer.current, view = map.current; if (!group || !view) return;
    group.clearLayers();
    for (const line of lines) {
      const path = L.polyline(line.points.map(toLatLng), { color: line.color, weight: line.weight ?? 6, opacity: .9, dashArray: line.dash === "none" ? undefined : line.dash, lineCap: "round" });
      if (line.title) path.bindTooltip(line.title, { sticky: true });
      path.on("click", event => { L.DomEvent.stopPropagation(event); handlers.current.onLineClick?.(line.id, [event.latlng.lng, event.latlng.lat]); });
      path.addTo(group);
    }
    for (const pin of pins) L.marker(toLatLng(pin.at), { icon: pinIcon(pin.tone), title: pin.label, keyboard: false }).addTo(group);
    if (fitted.current !== fitKey) {
      const points = lines.flatMap(line => line.points.map(toLatLng));
      if (points.length) { view.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 17 }); fitted.current = fitKey; }
    }
  }, [lines, pins, fitKey]);
  return <div ref={host} role="region" aria-label={label} className={cn("z-0 h-80 w-full overflow-hidden rounded-xl border bg-muted", className)} />;
}
