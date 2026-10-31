import type { DriverDashboard, Route } from "@floodops/contracts";
import { Card, DataTable } from "@floodops/ui-web";
import { accessReason, ownDataReason, type AccessContext } from "../../shared/access";
import { Denied, etaLabel, ResourceView, SimulationBanner, type Resource } from "../../shared/feature-state";
import { DriverRoutes } from "./driver-routes";
import { ReportList } from "./report-list";

export function DriverWorkspace({ context, resource, routes = { status: "loading" } }: { context: AccessContext; resource: Resource<DriverDashboard>; routes?: Resource<readonly Route[]> }) {
  const denied = accessReason(context, "driver:self:read", "driver");
  if (denied) return <Denied reason={denied} />;
  return <ResourceView resource={resource}>{dashboard => {
    const reason = ownDataReason(context, dashboard.session, dashboard.driver_id);
    if (reason || dashboard.driver.driver_id !== dashboard.driver_id || dashboard.assigned_orders.some(order => order.driver_id !== dashboard.driver_id) ||
      dashboard.own_reports.some(report => report.participant_id !== context.identity.participant.participant_id))
      return <Denied reason={reason ?? "Dữ liệu không thuộc driver hiện tại."} />;
    return <div className="grid min-w-0 gap-4"><SimulationBanner session={dashboard.session} provenance={context.provenance} />
      <h1>Việc của tôi</h1><p>Committed · {dashboard.driver.vehicle_type} · {dashboard.driver.status}</p>
      <Card title="Đơn đã phân công"><DataTable caption="Đơn của tôi" rows={dashboard.assigned_orders} rowKey={order => order.order_id}
        emptyLabel="Chưa có đơn được phân công." columns={[
          { key: "order", label: "Đơn / ưu tiên", render: order => `${order.order_id} · ${order.tier}` },
          { key: "state", label: "Trạng thái", render: order => order.lifecycle },
          { key: "eta", label: "ETA đã commit", render: order => etaLabel(order.eta_minute) },
          { key: "source", label: "Nguồn", render: order => order.provenance_label },
        ]} /></Card>
      <Card title="Điểm dừng đã commit"><ol>{dashboard.driver.ordered_stops.map(stop => <li key={stop.stop_id}>
        {stop.kind} · {stop.order_id} · {stop.node_id} · {stop.service_minute} phút phục vụ
      </li>)}</ol>{!dashboard.driver.ordered_stops.length && <p>Chưa có điểm dừng.</p>}
        <p>Tuyến gắn với dashboard: {dashboard.route_ids.join(", ") || "Đang chờ"}</p>
      </Card><DriverRoutes dashboard={dashboard} resource={routes} /><ReportList reports={dashboard.own_reports} />
    </div>;
  }}</ResourceView>;
}
