import type { Report } from "@floodops/contracts";
import { RewardFeedback } from "./reward-feedback";
import { DataTable } from "@floodops/ui-web";

export function ReportList({ reports }: { reports: readonly Report[] }) {
  return <DataTable caption="Trạng thái báo cáo" rows={reports} rowKey={report => report.report_id}
    emptyLabel="Chưa có báo cáo." columns={[
      { key: "report", label: "Báo cáo", render: report => <>{report.report_id}<p>{report.description}</p></> },
      { key: "status", label: "Review", render: report => <>{report.status}<p>{report.reason_codes.join(", ") || "Chưa có lý do từ server"}</p></> },
      { key: "award", label: "Thưởng", render: report => <RewardFeedback report={report} /> },
    ]} />;
}
