import type { ContributorDashboard } from "@floodops/contracts";
import { Card, DataTable } from "@floodops/ui-web";
import { accessReason, ownDataReason, type AccessContext } from "../../shared/access";
import { Denied, ResourceView, SimulationBanner, type Resource } from "../../shared/feature-state";
import { ReportList } from "./report-list";

export function ContributorWorkspace({ context, resource }: { context: AccessContext; resource: Resource<ContributorDashboard> }) {
  const denied = accessReason(context, "contributor:self:read", "contributor");
  if (denied) return <Denied reason={denied} />;
  return <ResourceView resource={resource}>{dashboard => {
    const reason = ownDataReason(context, dashboard.session, dashboard.contributor_id);
    if (reason || dashboard.own_reports.some(report => report.participant_id !== context.identity.participant.participant_id) ||
      dashboard.awards.some(award => award.contributor_id !== dashboard.contributor_id)) return <Denied reason={reason ?? "Dữ liệu không thuộc contributor hiện tại."} />;
    return <main><SimulationBanner session={dashboard.session} provenance={context.provenance} />
      <h1>Báo cáo của tôi</h1><ReportList reports={dashboard.own_reports} />
      <Card title="Điểm mô phỏng" description="Simulated · Ledger server; báo cáo accepted chưa chắc đủ điều kiện thưởng.">
        <p>Tổng: {dashboard.points_total}</p><DataTable caption="Ledger của tôi" rows={dashboard.awards} rowKey={award => award.award_id}
          emptyLabel="Chưa có điểm được cấp." columns={[
            { key: "report", label: "Báo cáo", render: award => award.report_id },
            { key: "points", label: "Điểm Simulated", render: award => award.points },
            { key: "gap", label: "Gap đã lấp", render: award => award.filled_gap_ids.join(", ") },
          ]} />
      </Card></main>;
  }}</ResourceView>;
}
