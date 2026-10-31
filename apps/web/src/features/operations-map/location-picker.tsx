import { useMemo, useRef, useState } from "react";
import type { Graph } from "@floodops/contracts";
import { mapLineStyle, tokens } from "@floodops/design-tokens";
import { Button } from "@floodops/ui-web";
import { LeafletMap, type LonLat, type MapLine, type MapPin } from "./leaflet-map";
import { nearestSegment } from "./nearest-segment";
import { streetNameAt } from "./street-name";

export interface PickedLocation { longitude: number; latitude: number; segmentId: string | null }
export interface LocationPickerProps {
  graph: Graph; longitude: string; latitude: string; segmentId: string; onPick: (picked: PickedLocation) => void; disabled?: boolean;
}
/** Beyond this the pick is still assigned to the nearest simulated segment, with a note that it lies outside the scenario area. */
const NEAR_METERS = 60;
export function LocationPicker({ graph, longitude, latitude, segmentId, onPick, disabled }: LocationPickerProps) {
  const [note, setNote] = useState(""), [street, setStreet] = useState(""), [locating, setLocating] = useState(false);
  const lookup = useRef<AbortController | null>(null);
  const base = mapLineStyle({ state: { tone: "unknown", label: "Chưa chọn" } });
  const lines = useMemo<MapLine[]>(() => graph.segments.map(segment => ({ id: segment.segment_id, points: segment.polyline, title: segment.segment_id,
    color: segment.segment_id === segmentId ? tokens.semantic.action.primary.bg : base.color, weight: segment.segment_id === segmentId ? 9 : 5 })), [graph, segmentId, base.color]);
  const lon = Number(longitude), lat = Number(latitude);
  const pins: MapPin[] = longitude.trim() && latitude.trim() && Number.isFinite(lon) && Number.isFinite(lat) ? [{ id: "pick", at: [lon, lat], label: "Vị trí báo cáo", tone: "pick" }] : [];
  function pick(at: LonLat, forced?: string) {
    const hit = nearestSegment(graph, at[0], at[1]), snapped = forced ?? hit?.segmentId ?? null;
    const far = !forced && hit !== null && hit.meters > NEAR_METERS;
    setNote(!snapped ? "Graph chưa có hình học đường." : far ? `Gán vào đoạn mô phỏng gần nhất ${snapped} (cách ${Math.round(hit!.meters)} m, ngoài vùng mô phỏng).` : `Đoạn mô phỏng ${snapped}.`);
    onPick({ longitude: Number(at[0].toFixed(6)), latitude: Number(at[1].toFixed(6)), segmentId: snapped });
    lookup.current?.abort(); const controller = new AbortController(); lookup.current = controller; setStreet("");
    void streetNameAt(at, controller.signal).then(name => { if (!controller.signal.aborted) setStreet(name ?? ""); });
  }
  function locate() {
    if (!("geolocation" in navigator)) { setNote("Trình duyệt không hỗ trợ định vị. Chọn vị trí trên bản đồ."); return; }
    setLocating(true); setNote("Đang lấy vị trí hiện tại…");
    navigator.geolocation.getCurrentPosition(position => { setLocating(false); pick([position.coords.longitude, position.coords.latitude]); },
      error => { setLocating(false); setNote(error.code === error.PERMISSION_DENIED ? "Bạn đã từ chối quyền vị trí. Chọn vị trí trên bản đồ." : "Không lấy được vị trí. Chọn vị trí trên bản đồ."); },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 });
  }
  return <div className="grid gap-2">
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" onClick={locate} {...(disabled ? { disabled: true as const, disabledReason: "Biểu mẫu đang bị khóa." } : locating ? { pending: true, pendingLabel: "Đang lấy vị trí…" } : { disabled: false as const })}>Dùng vị trí của tôi</Button>
      <span role="status" className="min-w-0 text-xs text-muted-foreground">
        {street && <strong className="mr-1 text-sm font-medium text-foreground">{street}.</strong>}
        {note || "Chạm vào đường hoặc bản đồ để chọn vị trí. Vị trí chỉ được gửi khi bạn bấm gửi báo cáo."}</span>
    </div>
    <LeafletMap label="Chọn vị trí trên bản đồ OpenStreetMap" lines={lines} pins={pins} fitKey={graph.graph_hash} className="h-72 sm:h-96"
      onLineClick={(id, at) => pick(at, id)} onMapClick={at => pick(at)} />
  </div>;
}
