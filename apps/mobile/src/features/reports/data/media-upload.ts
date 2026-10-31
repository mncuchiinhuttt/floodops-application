import { RequestScope, type ApiClient } from "@floodops/api-client";
import { commandReason, sameSession, type MobileContext } from "../../../shared/session-context";
export function imageContentType(bytes: Uint8Array): "image/jpeg" | "image/png" {
  if (!bytes.length || bytes.length > 5_242_880) throw new Error("Image byte limit exceeded");
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if ([137,80,78,71,13,10,26,10].every((byte, index) => bytes[index] === byte)) return "image/png";
  throw new Error("Only JPEG/PNG photos are supported");
}
export function currentMediaContext(context: () => MobileContext | null, captured: MobileContext): MobileContext {
  const current = context();
  if (!current || !sameSession(current.session, captured.session) || current.participant.participant_id !== captured.participant.participant_id || commandReason(current, "media:write")) throw new Error("Refresh authorized media scope");
  return current;
}
/** Same production pipeline for native file bytes and actual local-HTTP verification. */
export async function uploadReportImage(api: ApiClient, bytes: Uint8Array, context: () => MobileContext | null, captured: MobileContext, key: () => string) {
  const current = currentMediaContext(context, captured); const content = new Uint8Array(bytes); const contentType = imageContentType(content);
  const scope = new RequestScope(current.session.session_id, current.session.generation); const path = { session_id: current.session.session_id };
  const check = () => { const next = context(); if (!next || !sameSession(next.session, current.session) || next.participant.participant_id !== current.participant.participant_id || commandReason(next, "media:write")) { scope.cancel(); throw new Error("Media owner changed"); } };
  try {
    check(); const reserve = await api.request("reserveMediaUpload", { path, headers: { "Idempotency-Key": key() }, body: { content_type: contentType, byte_length: content.byteLength, original_filename: contentType === "image/jpeg" ? "report.jpg" : "report.png" } }, { scope });
    check(); const uploadPath = { ...path, upload_id: reserve.body.data.upload_id };
    await api.request("uploadMediaContent", { path: uploadPath, headers: { "Idempotency-Key": key() }, body: content }, { scope });
    check(); const complete = await api.request("completeMediaUpload", { path: uploadPath, headers: { "Idempotency-Key": key() }, body: { confirm_uploaded: true } }, { scope });
    check(); return { mediaId: complete.body.data.media_id };
  } finally { scope.cancel(); }
}
