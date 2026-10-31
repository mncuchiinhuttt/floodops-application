import { Text } from "react-native";
import { Alert, Card } from "@floodops/ui-native";
import type { Graph, SessionSnapshot, VehicleType } from "@floodops/contracts";
import { DataScreen } from "../../shared/screen-frame";
import type { QueryState } from "../../shared/query-state";
import { sameSession, type MobileContext } from "../../shared/session-context";
import { OperationsMap } from "./operations-map";
export function OverviewScreen({ context, query, graph, vehicle }: {
  context: MobileContext; query: QueryState<SessionSnapshot>; graph: Graph; vehicle: VehicleType;
}) {
  return <DataScreen title="Dispatch overview and map" context={context} query={query} permission="operations:read" roles={["dispatcher"]}>
    {snapshot => !sameSession(context.session, snapshot.session) || snapshot.graph_hash !== graph.graph_hash
      ? <Alert title="Snapshot mismatch">Refresh the matching session and graph.</Alert> : <>
        <Card title="Incident impact"><Text>Incidents: {snapshot.impact.incident_ids.join(", ") || "None"}</Text>
          <Text>Affected driver references: {snapshot.impact.affected_driver_ids.join(", ") || "None"}</Text>
          <Text>Priority order: {snapshot.impact.priority_order_ids.join(", ") || "None"}</Text>
        </Card>
        <OperationsMap graph={graph} knowledge={snapshot.knowledge.segments} vehicle={vehicle} />
        <Text>Latest proposal: {snapshot.latest_plan?.status ?? "No proposal"} · Projected plans do not change committed assignments.</Text>
      </>}
  </DataScreen>;
}
