import type { DriverDashboard, Route } from "@floodops/contracts";
import { Card } from "@floodops/ui-web";
import { Denied, etaLabel, ResourceView, type Resource } from "../../shared/feature-state";

export function DriverRoutes({ dashboard, resource }: { dashboard: DriverDashboard; resource: Resource<readonly Route[]> }) {
  if (!dashboard.route_ids.length) return <Card title="Chi tiết tuyến"><p>Chưa có tuyến gắn với dashboard.</p></Card>;
  return <Card title="Chi tiết tuyến theo dashboard"><ResourceView resource={resource}>{routes => {
    if (routes.length !== dashboard.route_ids.length || new Set(routes.map(route => route.route_id)).size !== routes.length ||
      routes.some(route => route.driver_id !== dashboard.driver_id || !dashboard.route_ids.includes(route.route_id)))
      return <Denied reason="Tuyến không thuộc dashboard hiện tại. Cần làm mới." />;
    return routes.map(route => <article key={route.route_id}><h3>{route.route_id}</h3>
      <p>Snapshot tuyến · {route.status} · Input revision {route.input_revision}</p>
      <p>ETA snapshot tuyến: {etaLabel(route.eta_minute)} · {route.distance_m} m</p>
      <p>Các đoạn đường: {route.segment_ids.join(" → ") || "Chưa có"}</p>
      <p>Đoạn chưa rõ: {route.unknown_segment_ids.join(", ") || "Không có trong snapshot tuyến"}</p>
      <p>Evidence: {route.evidence_ids.join(", ") || "Chưa có"}</p>
    </article>);
  }}</ResourceView></Card>;
}
