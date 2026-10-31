import { Alert } from "@floodops/ui-native";
import { IdSchema } from "@floodops/contracts";
import type { Report } from "@floodops/contracts";
import type { MobileContext } from "../../../shared/session-context";
import { accessReason } from "../../../shared/session-context";
import { useNativeRuntime } from "../../session/runtime/native-runtime";
import { useNativeCommand } from "../../../shared/native/use-native-command";
import { useResource, ResourceBoundary, commandContext } from "../../../shared/native/runtime-resource";
import { ScreenFrame } from "../../../shared/screen-frame";
import { nativeKey } from "../../../shared/native/random-key";
import { PrivateReportPhoto } from "./private-report-photo";
import { ReviewScreen } from "../review-screen";
import { useReportAdvice } from "./use-report-advice";
export function ReviewRuntime({ reportId }: { reportId: string }) {
  const { context } = useNativeRuntime(); if (!context) return null;
  const denied = accessReason(context, "reports:review", ["dispatcher"]);
  if (denied || !IdSchema.safeParse(reportId).success) return <ScreenFrame title="Review unavailable" context={context}><Alert title="Capability required">{denied ?? "Invalid report reference."}</Alert></ScreenFrame>;
  return <CurrentReport key={`${context.session.session_id}:${context.session.generation}:${context.participant.participant_id}:${reportId}`} context={context} reportId={reportId} />;
}
function CurrentReport({ context, reportId }: { context: MobileContext; reportId: string }) {
  const query = useResource(context, ["report", reportId], async (api, options) => { const result = await api.request("getReport", { path: { session_id: context.session.session_id, report_id: reportId } }, options); return { value: result.body.data, meta: result.body.meta }; });
  return <ResourceBoundary title="Report review" context={context} query={query}>{report => <AdviceReview context={commandContext(context, query)} report={report} />}</ResourceBoundary>;
}
function AdviceReview({ context, report }: { context: MobileContext; report: Report }) {
  const runtime = useNativeRuntime(), command = useNativeCommand(); const { advice, refreshAdvice } = useReportAdvice(context, report);
  return <>{command.error && <Alert title="Review request status">{command.error}</Alert>}
    {report.media_id && <PrivateReportPhoto context={context} mediaId={report.media_id} />}
    <ReviewScreen context={context} report={report} advice={advice} pending={command.pending}
      onReview={input => void command.run(() => runtime.client!.reviewReport(report.report_id, input, nativeKey()))}
      onAiRequest={() => void command.run(async () => { await runtime.client!.requestImageReview(report.report_id, nativeKey()); refreshAdvice(); })} />
  </>;
}
