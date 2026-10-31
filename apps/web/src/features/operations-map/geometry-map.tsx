import { useId, useMemo, useState } from "react";
import type { Graph, Knowledge, OperationalBranch, Route, VehicleType } from "@floodops/contracts";
import { mapLineStyle, mapPath, mapRouteStyle } from "@floodops/design-tokens";
import { Alert, Button, MapLegend } from "@floodops/ui-web";
import { activeRoutes, entityMarkers, segmentState } from "./map-model";
import { createProjection, scaleLength, zoomedView } from "./projection";
import { etaLabel } from "../../shared/feature-state";
import { MapLists } from "./map-lists";

export function GeometryMap({ graph, knowledge, branch, routes, vehicle, minute, knowledgeCurrent = true }: { graph: Graph; knowledge: Knowledge | null; branch: OperationalBranch | null; routes: readonly Route[]; vehicle: VehicleType; minute: number; knowledgeCurrent?: boolean }) {
  const [zoom, setZoom] = useState(1), [pan, setPan] = useState({ x: 0, y: 0 }), [selected, setSelected] = useState<string | null>(null);
  const markers = useMemo(() => entityMarkers(graph, branch), [graph, branch]);
  const projection = useMemo(() => createProjection(graph, markers.flatMap(marker => marker.coordinate ? [marker.coordinate] : [])), [graph, markers]);
  const arrow = useId(), visibleRoutes = activeRoutes(graph, branch, routes, vehicle);
  const view = projection ? zoomedView(projection.fit, zoom, pan) : null;
  const bar = view ? scaleLength(view.width) : 0;
  const entity = markers.find(marker => marker.id === selected), segment = graph.segments.find(item => item.segment_id === selected);
  const move = (x: number, y: number) => { if (view) setPan(value => ({ x: value.x + x * view.width, y: value.y + y * view.height })); };
  return <section aria-label="Map geometry server"><div className="feature-actions">
    <Button aria-label="Phóng to map" onClick={() => setZoom(value => Math.min(16, value * 2))}>Phóng to</Button>
    <Button aria-label="Thu nhỏ map" onClick={() => setZoom(value => Math.max(1, value / 2))}>Thu nhỏ</Button>
    <Button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Fit geometry</Button>
    <Button onClick={() => move(-0.2, 0)}>Pan trái</Button><Button onClick={() => move(0.2, 0)}>Pan phải</Button>
    <Button onClick={() => move(0, -0.2)}>Pan bắc</Button><Button onClick={() => move(0, 0.2)}>Pan nam</Button>
  </div>
    {view && projection ? <figure><svg style={{ width: "100%", aspectRatio: "2 / 1" }} viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Geometry WGS84, bắc ở trên; knowledge ${vehicle}. Danh sách tương đương bên dưới.`}>
      <defs><marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="#52636d" /></marker></defs>
      {graph.segments.map(road => { const style = mapLineStyle({ state: segmentState(road, knowledge, vehicle, minute, knowledgeCurrent) });
        return <path key={road.segment_id} data-segment-id={road.segment_id} d={mapPath(road.polyline.map(projection.project))} fill="none" stroke={style.color} strokeDasharray={style.dash} strokeWidth="7" vectorEffect="non-scaling-stroke" markerEnd={`url(#${arrow})`}><title>{road.segment_id} · {segmentState(road, knowledge, vehicle, minute, knowledgeCurrent).label}</title></path>;
      })}
      {visibleRoutes.accepted.flatMap(route => route.segment_ids.map((id, index) => { const road = graph.segments.find(item => item.segment_id === id)!; const style = mapRouteStyle("primary")!;
        return <path key={`${route.route_id}-${index}`} data-route-id={route.route_id} d={mapPath(road.polyline.map(projection.project))} fill="none" stroke={style.color} strokeWidth="2" vectorEffect="non-scaling-stroke"><title>Committed pointer {route.route_id}</title></path>;
      }))}
      {branch?.drivers.filter(driver => driver.position.kind === "on_edge").map(driver => {
        const road = graph.segments.find(item => item.segment_id === driver.position.segment_id); return road ? <path key={driver.driver_id} d={mapPath(road.polyline.map(projection.project))} fill="none" stroke="#713b00" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke"><title>{driver.vehicle_type} {driver.driver_id} trên edge</title></path> : null;
      })}
      {graph.nodes.map(node => { const point = projection.project(node.coordinate); return <circle key={node.node_id} cx={point.x} cy={point.y} r={view.width / 300} fill="#52636d"><title>{node.node_id}</title></circle>; })}
      {markers.filter(marker => marker.coordinate).map(marker => { const point = projection.project(marker.coordinate!); return <circle key={marker.id} cx={point.x} cy={point.y} r={view.width / 180} fill="#0b5d72"><title>{marker.label}</title></circle>; })}
      <path d={`M${view.x + view.width * 0.03} ${view.y + view.height * 0.94}h${bar}`} stroke="#12212b" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      <text x={view.x + view.width * 0.03} y={view.y + view.height * 0.91} fontSize={view.height * 0.035}>{bar} m</text>
    </svg><figcaption>Khung nhìn {Math.round(view.width)}×{Math.round(view.height)} m · Zoom {zoom}× · {vehicle} · Phép chiếu cục bộ theo WGS84.</figcaption></figure> :
      <Alert title="Không có phạm vi geometry">Graph trống hoặc toàn bộ tọa độ trùng nhau. Danh sách vẫn giữ dữ liệu server.</Alert>}
    <MapLegend /><section aria-label="Routes theo committed pointer"><h3>Routes theo branch / loại xe</h3>
      {visibleRoutes.accepted.length ? <ol>{visibleRoutes.accepted.map(route => <li key={route.route_id}>{route.route_id} · driver {route.driver_id} · ETA {etaLabel(route.eta_minute)}<p>Thứ tự đoạn: {route.segment_ids.join(" → ")}</p></li>)}</ol> : <p>Chưa có route khả dụng cho loại xe này.</p>}
    </section>{visibleRoutes.missing.length > 0 && <Alert title="Route unavailable">{visibleRoutes.missing.join(", ")}</Alert>}
    <p>Graph {graph.graph_hash}; geometry và chiều dài server chưa tự chứng minh hiệu chuẩn, quyền sử dụng đường thật hoặc an toàn.</p>
    {(entity || segment) && <section aria-label="Chi tiết thực thể"><h3>{selected}</h3><p>{entity?.detail ?? `${segment!.from_node_id} → ${segment!.to_node_id} · ${segment!.length_m} m`}</p>
      {segment?.provenance.map((source, index) => <p key={index}>{source.label} · {source.licence} · {source.method}</p>)}</section>}
    <MapLists graph={graph} knowledge={knowledge} branch={branch} vehicle={vehicle} minute={minute} knowledgeCurrent={knowledgeCurrent} onSelect={setSelected} />
  </section>;
}
