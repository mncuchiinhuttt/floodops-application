import { Text } from "react-native";
import { Alert, Card, ProvenanceBadge } from "@floodops/ui-native";
import type { DriverDashboard } from "@floodops/contracts";
import { DataScreen } from "../../shared/screen-frame";
import type { QueryState } from "../../shared/query-state";
import { sameSession, type MobileContext } from "../../shared/session-context";
import { OwnReportList } from "../reports/own-report-list";
export function DriverScreen({ context, query }: { context: MobileContext; query: QueryState<DriverDashboard> }) {
  return <DataScreen title="My committed work" context={context} query={query} permission="driver:self:read" roles={["driver"]}>
    {dashboard => dashboard.driver_id !== context.participant.bound_entity_id || dashboard.driver.driver_id !== dashboard.driver_id ||
      !sameSession(context.session, dashboard.session) ? <Alert title="Scope mismatch">Refresh your own driver dashboard.</Alert> : <>
      <Text>Committed assignment · Server revision {dashboard.session.revision}</Text>
      <Text>{dashboard.driver.vehicle_type} · {dashboard.driver.status}</Text>
      {dashboard.assigned_orders.filter(order => order.driver_id === dashboard.driver_id).map(order => <Card key={order.order_id} title={order.order_id}>
        <ProvenanceBadge tone={order.provenance_label} /><Text>{order.tier} · {order.lifecycle}</Text>
        <Text>Committed ETA: {order.eta_minute === null ? "Waiting / unavailable" : `${order.eta_minute} min`}</Text>
        <Text>Original SLA: {order.original_sla_minute} min · Pickup {order.pickup_hub_id}</Text>
      </Card>)}
      <Card title="Ordered stops">{dashboard.driver.ordered_stops.map((stop, index) => <Text key={stop.stop_id}>
        {index + 1}. {stop.kind} {stop.order_id} · {stop.node_id} · Service {stop.service_minute} min
      </Text>)}</Card>
      <Text>Server route references: {dashboard.route_ids.join(", ") || "No committed route reference"}</Text>
      <Text>Updates appear after successful server Execute and refresh.</Text>
      <OwnReportList reports={dashboard.own_reports} participantId={context.participant.participant_id} />
    </>}
  </DataScreen>;
}
