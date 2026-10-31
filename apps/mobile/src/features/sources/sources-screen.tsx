import { Text } from "react-native";
import { Card, ProvenanceBadge } from "@floodops/ui-native";
import type { Knowledge, Source } from "@floodops/contracts";
import { DataScreen } from "../../shared/screen-frame";
import type { QueryState } from "../../shared/query-state";
import type { MobileContext } from "../../shared/session-context";
export interface SourcesView { sources: Source[]; knowledge: Knowledge }
export function SourcesScreen({ context, query }: { context: MobileContext; query: QueryState<SourcesView> }) {
  return <DataScreen title="Sources and conflicts" context={context} query={query} permission="knowledge:read" roles={["dispatcher"]}>
    {view => <>
      <Text>Vehicle/segment coverage: {view.knowledge.coverage.covered_pairs}/{view.knowledge.coverage.relevant_pairs} · Ratio {view.knowledge.coverage.ratio ?? "N/A"}</Text>
      {view.sources.map(source => <Card key={source.source_id} title={source.provider} description={source.access_status}>
        <ProvenanceBadge tone={source.provenance.label} /><Text>{source.source_type} · {source.role}</Text>
        <Text>{source.provenance.method}</Text><Text>Source date: {source.provenance.source_date ?? "Unavailable"} · Licence: {source.provenance.licence}</Text>
        <Text>{source.role === "context" ? "Context only; cannot establish street passability." : "Subject to server evidence and policy checks."}</Text>
      </Card>)}
      {view.knowledge.segments.map(segment => <Card key={`${segment.segment_id}:${segment.vehicle_type}`} title={`${segment.segment_id} · ${segment.vehicle_type}`}>
        <Text>{segment.state} · {segment.condition} · Epoch {segment.knowledge_epoch}</Text>
        <Text>Evidence expiry: {segment.expires_sim_minute ?? "No current expiry"} simulation min</Text>
        <Text>Observations: {segment.observation_ids.join(", ") || "None"} · Restrictions: {segment.restriction_ids.join(", ") || "None"}</Text>
        <Text>{segment.state === "unresolved_conflict" ? "Blocked pending conflict review. Approval cannot override this." : "Only current vehicle-scoped evidence applies."}</Text>
      </Card>)}
    </>}
  </DataScreen>;
}
