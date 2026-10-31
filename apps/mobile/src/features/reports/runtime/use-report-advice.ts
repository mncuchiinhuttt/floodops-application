import { useEffect, useRef, useState } from "react";
import { RequestScope } from "@floodops/api-client";
import type { Report } from "@floodops/contracts";
import type { MobileContext } from "../../../shared/session-context";
import { useNativeRuntime } from "../../session/runtime/native-runtime";
import { adviceEvent, beginAdvice, initialAdvice, receiveAdvice } from "../image-review-state";
import { reportInputKey } from "../report-input-key";
export function useReportAdvice(context: MobileContext, report: Report) {
  const runtime = useNativeRuntime(); const input = reportInputKey(report);
  const bind = () => ({ session_id: context.session.session_id, generation: context.session.generation, reportId: report.report_id, jobId: null, inputDigest: null, reportInput: input });
  const view = useRef(initialAdvice(bind(), context.session.event_sequence));
  const [, update] = useState(0), [explicit, requestRefresh] = useState(0);
  if (view.current.binding.reportInput !== input) view.current = beginAdvice(view.current, bind());
  const event = runtime.lastEvent;
  const invalidation = event ? adviceEvent(view.current, event) : { view: view.current, refetch: false };
  view.current = invalidation.view;
  const eligible = report.kind === "citizen" && report.input_mode === "photo" && report.status === "pending_review" && Boolean(report.media_id || report.fixture_photo_id);
  const relevantEvent = useRef("none");
  if (invalidation.refetch && event) relevantEvent.current = event.event_id;
  const eventKey = relevantEvent.current;
  useEffect(() => {
    if (!context.online || !eligible || view.current.invalidated) return;
    const scope = new RequestScope(context.session.session_id, context.session.generation);
    const binding = bind(); view.current = beginAdvice(view.current, binding); const request = view.current.request; update(v => v + 1);
    void runtime.service.api.request("getReportImageReview", { path: { session_id: context.session.session_id, report_id: report.report_id } }, { scope }).then(async result => {
      const currentReport = await runtime.service.api.request("getReport", { path: { session_id: context.session.session_id, report_id: report.report_id } }, { scope });
      if (scope.signal.aborted || reportInputKey(currentReport.body.data) !== binding.reportInput) return;
      const meta = { ...context.session, event_sequence: result.body.meta.event_sequence ?? context.session.event_sequence };
      view.current = receiveAdvice(view.current, binding, result.body.data, meta, request); update(v => v + 1);
    }).catch(() => { if (!scope.signal.aborted) { view.current = { ...view.current, job: null, loading: false }; update(v => v + 1); } });
    return () => scope.cancel();
  }, [context.session.session_id, context.session.generation, context.participant.participant_id, context.online, input, eligible, eventKey, explicit, runtime.service]);
  const pending = view.current.job?.status === "running" || view.current.job?.status === "queued";
  useEffect(() => { if (!context.online || !pending) return; const timer = setInterval(() => requestRefresh(v => v + 1), 2000); return () => clearInterval(timer); }, [context.online, pending]);
  return { advice: view.current, refreshAdvice: () => requestRefresh(v => v + 1) };
}
