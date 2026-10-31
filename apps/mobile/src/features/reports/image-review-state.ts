import type { Event, ImageReviewJob, ImageReviewState, SessionMeta } from "@floodops/contracts";
import { sameSession } from "../../shared/session-context";
export interface AdviceBinding { session_id: string; generation: number; reportId: string; jobId: string | null; inputDigest: string | null }
export interface AdviceView { binding: AdviceBinding; sequence: number; request: number; job: ImageReviewJob | null; invalidated: boolean; loading: boolean }
export function initialAdvice(binding: AdviceBinding, sequence: number): AdviceView {
  return { binding, sequence, request: 0, job: null, invalidated: false, loading: true };
}
/** A new binding must come from a current authorized server response, never model/event content. */
export function beginAdvice(view: AdviceView, binding: AdviceBinding = view.binding): AdviceView {
  if (view.invalidated || !sameSession(view.binding, binding) || binding.reportId !== view.binding.reportId) return view;
  return { ...view, binding, job: null, loading: true, request: view.request + 1 };
}
/** Events contain safe IDs only: invalidate immediately, then refetch the authorized current report/job. */
export function adviceEvent(view: AdviceView, event: Event): { view: AdviceView; refetch: boolean } {
  if (!sameSession(view.binding, event) || event.event_sequence <= view.sequence) return { view, refetch: false };
  if (["session_reset", "session_expired", "capability_revoked"].includes(event.type)) {
    return { view: { ...view, sequence: event.event_sequence, request: view.request + 1, invalidated: true, job: null }, refetch: false };
  }
  if (view.invalidated) return { view, refetch: false };
  const refresh = ["image_review_changed", "report_changed"].includes(event.type) && event.resource_ids.includes(view.binding.reportId);
  return { view: { ...view, sequence: event.event_sequence, ...(refresh ? { job: null, loading: true, request: view.request + 1 } : {}) }, refetch: refresh };
}
/** Current fetch ticket plus complete session/report/job/digest binding fence late results at unchanged revision. */
export function receiveAdvice(view: AdviceView, binding: AdviceBinding, state: ImageReviewState, meta: SessionMeta, request: number): AdviceView {
  if (view.invalidated || request !== view.request || !view.loading || !sameSession(view.binding, meta) || !sameSession(binding, view.binding) ||
    binding.reportId !== view.binding.reportId || binding.jobId !== view.binding.jobId || binding.inputDigest !== view.binding.inputDigest ||
    meta.event_sequence < view.sequence || state.report_id !== binding.reportId) return view;
  const job = state.job;
  if (job && (!sameSession(binding, job) || job.report_id !== binding.reportId ||
    (binding.jobId !== null && job.job_id !== binding.jobId) || (binding.inputDigest !== null && job.input_digest !== binding.inputDigest))) return view;
  return { ...view, binding: { ...binding, jobId: job?.job_id ?? null, inputDigest: job?.input_digest ?? null },
    sequence: meta.event_sequence, job, loading: false };
}
