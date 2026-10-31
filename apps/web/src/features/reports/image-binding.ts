import { ImageReviewStateSchema, parseConsistentImageReviewAdvice, type Event, type ImageReviewState, type Meta, type Report } from "@floodops/contracts";

export interface ImageBinding { sessionId: string; generation: number; reportId: string; jobId: string; inputDigest: string; reportInputRevision: number; reportContext: string }
export function imageStateMatches(state: ImageReviewState, binding: ImageBinding): boolean {
  const parsed = ImageReviewStateSchema.safeParse(state);
  if (!parsed.success) return false;
  const job = parsed.data.job;
  return state.report_id === binding.reportId && !!job && job.session_id === binding.sessionId && job.generation === binding.generation &&
    job.report_id === binding.reportId && job.job_id === binding.jobId && job.input_digest === binding.inputDigest;
}
export function currentAdvice(state: ImageReviewState, binding: ImageBinding) {
  if (!imageStateMatches(state, binding) || state.job?.status !== "completed" || !state.job.result) return null;
  try { return parseConsistentImageReviewAdvice(state.job.result); } catch { return null; }
}
/** A future stream adapter supplies authorized events and current server binding. Revision is intentionally not a filter. */
export class ImageReviewRefresh {
  private ticket = 0;
  private lastSequence = -1;
  private bindingKey = "";
  constructor(private readonly readBinding: () => ImageBinding | null,
    private readonly load: (binding: ImageBinding) => Promise<{ data: ImageReviewState; meta: Meta }>,
    private readonly update: (state: ImageReviewState) => void) {}
  reset(): void { this.ticket++; this.lastSequence = -1; }
  async onEvent(event: Event): Promise<boolean> {
    const binding = this.readBinding();
    const key = binding ? `${binding.sessionId}:${binding.generation}:${binding.reportId}:${binding.jobId}:${binding.inputDigest}:${binding.reportInputRevision}:${binding.reportContext}` : "";
    if (key !== this.bindingKey) { this.reset(); this.bindingKey = key; }
    if (!binding || event.type !== "image_review_changed" || event.session_id !== binding.sessionId || event.generation !== binding.generation ||
      event.event_sequence <= this.lastSequence || !event.resource_ids.includes(binding.reportId)) return false;
    this.lastSequence = event.event_sequence;
    const ticket = ++this.ticket;
    const response = await this.load(binding);
    const current = this.readBinding();
    if (ticket !== this.ticket || !current || current.sessionId !== binding.sessionId || current.generation !== binding.generation ||
      current.reportId !== binding.reportId || current.jobId !== binding.jobId || current.inputDigest !== binding.inputDigest || current.reportInputRevision !== binding.reportInputRevision || current.reportContext !== binding.reportContext ||
      response.meta.session_id !== binding.sessionId || response.meta.generation !== binding.generation ||
      (response.meta.event_sequence ?? -1) < event.event_sequence || !imageStateMatches(response.data, current)) return false;
    this.update(response.data); return true;
  }
}

export function reportImageContext(report: Report): string {
  return JSON.stringify([report.report_id, report.status, report.description, report.segment_id, report.coordinate, report.captured_at,
    report.captured_sim_minute, [...report.vehicle_types].sort(), report.media_id, report.fixture_photo_id, report.input_mode, report.quick_condition]);
}
