import { parseSchema } from "@floodops/contracts";
import type { Condition, Media, Report, ReviewInput, SubmitReportInput } from "@floodops/contracts";
import { call, complete, headers, key, png, put } from "../media/helpers";
import type { Member } from "../media/helpers";
import { accept, createV2, current, join, snapshot, submit } from "../media/review-adapter-fixtures";
import { injectionCorpus } from "./scenario-corpus";
import type { InjectionScenario } from "./scenario-corpus";

export { accept, call, createV2, current, headers, join, key, snapshot, submit };
export type { Member };
export const runtimeScenarios = injectionCorpus.cases.filter(item => item.surface === "runtime-commander");
export function descriptionFor(scenario: InjectionScenario): string { return `INJECTION_CASE=${scenario.case_id}\n${scenario.payload}`; }
export function filenameFor(scenario: InjectionScenario): string { return `../../${scenario.case_id}/<script>filename</script>.png`; }
export async function uploadWithFilename(member: Member, filename: string): Promise<Media> {
  const bytes = png(), reserve = await call(`/sessions/${member.id}/media-uploads`, { method: "POST", headers: headers(member,
    { "Content-Type": "application/json", "Idempotency-Key": key() }), body: JSON.stringify({ content_type: "image/png",
      byte_length: bytes.length, original_filename: [...filename].slice(0, 128).join("") }) });
  if (reserve.status !== 201) throw new Error(`Media reservation failed: ${reserve.status}`);
  const upload = parseSchema("MediaUploadResponse", await reserve.json()).data!;
  const uploaded = await put(member, upload, bytes); if (uploaded.status !== 200) throw new Error(`Media upload failed: ${uploaded.status}`);
  const finished = await complete(member, upload); if (finished.status !== 201) throw new Error(`Media normalization failed: ${finished.status}`);
  return parseSchema("MediaResponse", await finished.json()).data!;
}
export async function submitPhoto(member: Member, media: Media, scenario: InjectionScenario): Promise<Report> {
  const input: SubmitReportInput = { kind: "citizen", media_id: media.media_id, fixture_photo_id: null, segment_id: "seg_edge27",
    coordinate: [106.701, 10.7705], captured_at: "2026-10-31T00:00:00Z", captured_sim_minute: 0,
    vehicle_types: ["motorbike"], description: descriptionFor(scenario) };
  return submit(member, input);
}
export async function submitDriver(member: Member, scenario: InjectionScenario, segmentId = "seg_edge27", condition: "normal" | "caution" = "normal"): Promise<Report> {
  const input: SubmitReportInput = { kind: "driver", input_mode: "quick", quick_condition: condition, segment_id: segmentId,
    coordinate: segmentId === "seg_edge17" ? [106.7005, 10.77] : [106.701, 10.7705], captured_at: "2026-10-31T00:00:00Z",
    captured_sim_minute: 0, vehicle_types: ["motorbike"], description: descriptionFor(scenario) };
  return submit(member, input);
}
export async function startImageReview(owner: Member, reportId: string, body: unknown = {}): Promise<Response> {
  return call(`/sessions/${owner.id}/reports/${reportId}/image-review-jobs`, { method: "POST", headers: headers(owner,
    { "Content-Type": "application/json", "Idempotency-Key": key() }), body: JSON.stringify(body) });
}
export async function manualDecision(owner: Member, reportId: string, decision: "accept" | "reject", condition: Condition | null): Promise<Response> {
  const fresh = await current(owner), input: ReviewInput = { decision, reason: "Dispatcher manually reviewed the synthetic report",
    mapped_segment_id: null, vehicle_types: [], condition };
  return call(`/sessions/${owner.id}/reports/${reportId}/reviews`, { method: "POST", headers: headers(owner,
    { "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": fresh.etag }), body: JSON.stringify(input) });
}
export async function imageState(owner: Member, reportId: string) {
  const response = await call(`/sessions/${owner.id}/reports/${reportId}/image-review`, { headers: headers(owner) });
  if (response.status !== 200) throw new Error(`Image review read failed: ${response.status}`);
  return parseSchema("ImageReviewStateResponse", await response.json()).data!;
}
export async function waitForImageState(owner: Member, reportId: string) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const state = await imageState(owner, reportId), status = state.job?.status;
    if (status === "completed" || status === "failed" || status === "superseded") return state;
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 5); await promise;
  }
  throw new Error("Image review job did not reach a terminal state");
}
export async function readReport(owner: Member, reportId: string): Promise<Report> {
  const response = await call(`/sessions/${owner.id}/reports/${reportId}`, { headers: headers(owner) });
  if (response.status !== 200) throw new Error(`Report read failed: ${response.status}`);
  return parseSchema("ReportResponse", await response.json()).data!;
}
