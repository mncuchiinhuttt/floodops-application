import { Text } from "react-native";
import { Alert, Card } from "@floodops/ui-native";
import type { Report, ReviewInput } from "@floodops/contracts";
import { accessReason, commandReason, type MobileContext } from "../../shared/session-context";
import { ScreenFrame } from "../../shared/screen-frame";
import type { AdviceView } from "./image-review-state";
import { ManualReviewForm } from "./manual-review-form";
import { ImageReviewCard } from "./image-review-card";
export function ReviewScreen({ context, report, advice, onReview, onAiRequest, pending = false }: {
  context: MobileContext; report: Report; advice: AdviceView; pending?: boolean;
  onReview?: (input: ReviewInput) => void; onAiRequest?: () => void;
}) {
  const denied = accessReason(context, "reports:review", ["dispatcher"]);
  const command = commandReason(context, "reports:review", ["dispatcher"]);
  const job = advice.job;
  const boundJob = report.status === "pending_review" && !advice.loading && !advice.invalidated && job &&
    advice.binding.session_id === context.session.session_id && advice.binding.generation === context.session.generation &&
    advice.binding.reportId === report.report_id && job.job_id === advice.binding.jobId && job.input_digest === advice.binding.inputDigest &&
    job.session_id === context.session.session_id && job.generation === context.session.generation && job.report_id === report.report_id ? job : null;
  return <ScreenFrame title="Report review" context={context}>
    {denied ? <Alert title="Review unavailable">{denied}</Alert> : <>
      <Card title={report.report_id} description={report.status}>
        <Text>{report.description}</Text><Text>Segment: {report.segment_id ?? "Unmapped"} · Vehicle: {report.vehicle_types.join(", ") || "Unknown"}</Text>
        <Text>Captured {report.captured_at} · Simulation minute {report.captured_sim_minute}</Text>
        <Text>Reasons: {report.reason_codes.join(", ") || "None"}</Text>
        <Text>{report.media_id ? `Private media reference: ${report.media_id}` : "No normalized media available"}</Text>
      </Card>
      <ImageReviewCard job={boundJob} reason={command ?? (report.status !== "pending_review" ? "Report is no longer pending review." : null)} onRequest={onAiRequest} />
      <ManualReviewForm key={`${context.session.session_id}:${context.session.generation}:${report.report_id}:${report.input_revision}`}
        context={context} report={report} onReview={onReview} pending={pending} />
      <Text>Acceptance, gap coverage and simulated awards are separate server outcomes.</Text>
    </>}
  </ScreenFrame>;
}
