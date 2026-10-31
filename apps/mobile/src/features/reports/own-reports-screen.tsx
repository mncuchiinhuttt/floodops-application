import { Text } from "react-native";
import type { Report } from "@floodops/contracts";
import { DataScreen } from "../../shared/screen-frame";
import type { MobileContext } from "../../shared/session-context";
import type { QueryState } from "../../shared/query-state";
import { OwnReportList } from "./own-report-list";
/** Real own-report endpoint stays useful while assignment/points projections are unavailable. */
export function OwnReportsScreen({ context, query }: { context: MobileContext; query: QueryState<Report[]> }) {
  return <DataScreen title="My server reports" context={context} query={query} permission={context.participant.role === "driver" ? "driver:self:read" : "contributor:self:read"} roles={["driver", "contributor"]}>
    {reports => <><Text>Assignment and points projections remain separate server views.</Text>
      <OwnReportList reports={reports} participantId={context.participant.participant_id} /></>}
  </DataScreen>;
}
