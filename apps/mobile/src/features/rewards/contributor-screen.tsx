import { Text } from "react-native";
import { Alert, Card } from "@floodops/ui-native";
import type { ContributorDashboard } from "@floodops/contracts";
import { DataScreen } from "../../shared/screen-frame";
import type { QueryState } from "../../shared/query-state";
import { sameSession, type MobileContext } from "../../shared/session-context";
import { OwnReportList } from "../reports/own-report-list";
export function ContributorScreen({ context, query }: { context: MobileContext; query: QueryState<ContributorDashboard> }) {
  return <DataScreen title="My reports and points" context={context} query={query} permission="contributor:self:read" roles={["contributor"]}>
    {dashboard => dashboard.contributor_id !== context.participant.bound_entity_id || !sameSession(context.session, dashboard.session)
      ? <Alert title="Scope mismatch">Refresh your own contributor dashboard.</Alert> : <>
        <Card title="Simulated points"><Text>Server-recorded total: {dashboard.points_total}</Text>
          <Text>Accepted reports, useful coverage and awards are separate outcomes.</Text></Card>
        <OwnReportList reports={dashboard.own_reports} participantId={context.participant.participant_id} />
        {dashboard.awards.filter(award => award.contributor_id === dashboard.contributor_id).map(award => <Card key={award.award_id} title={`Simulated award ${award.award_id}`}>
          <Text>{award.points} points · Report {award.report_id}</Text>
          <Text>Review result: {award.review_result_id} · Policy {award.reward_policy.policy_id} · {award.reward_policy.version}</Text><Text>Filled gaps: {award.filled_gap_ids.join(", ")}</Text>
        </Card>)}
      </>}
  </DataScreen>;
}
