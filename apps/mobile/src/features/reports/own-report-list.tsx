import { Text, View } from "react-native";
import { Card } from "@floodops/ui-native";
import { ReportRewardFeedback } from "./report-reward-feedback";
import type { Report } from "@floodops/contracts";
export function OwnReportList({ reports, participantId }: { reports: readonly Report[]; participantId: string }) {
  const own = reports.filter(report => report.participant_id === participantId);
  return <View>{own.length === 0 && <Text>No reports in your authorized view.</Text>}
    {own.map(report => <Card key={report.report_id} title={report.report_id} description={report.status}>
      <Text>{report.description}</Text><Text>Captured {report.captured_at} · {report.segment_id ?? "Manual location"}</Text>
      <Text>Reason codes: {report.reason_codes.join(", ") || "None"}</Text>
      <ReportRewardFeedback report={report} />
    </Card>)}
  </View>;
}
