import type { Event, ErrorCode, Meta } from "@floodops/contracts";
export const sessionId = "session_test0001";
export const meta: Meta = { request_id: "request_test01", session_id: sessionId, generation: 2, revision: 3, event_sequence: 0 };
export const state = { report_id: "report_test0001", job: null };
export const response = (data: unknown, customMeta = meta, status = 200, headers: HeadersInit = {}) =>
  Response.json({ success: true, data, error: null, meta: customMeta }, { status, headers });
export const errorResponse = (status: number, code: ErrorCode, retryable = false, headers: HeadersInit = {}) =>
  Response.json({ success: false, data: null, error: { code, message: "Synthetic test failure", details: [], retryable,
    current_revision: null, replacement_session_id: null }, meta }, { status, headers });
export const event = (sequence: number, overrides: Partial<Event> = {}): Event => ({
  event_id: `event_test000${sequence}`, event_sequence: sequence, session_id: sessionId, generation: 2, revision: 3,
  sim_minute: 0, type: "image_review_changed", actor: "system", resource_ids: ["report_test0001"],
  reason_code: "Synthetic visible update", replacement_session_id: null, created_at: "2026-10-31T10:00:00Z", ...overrides,
});
export function byteStream(text: string, size = 1): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  let offset = 0;
  return new ReadableStream({ pull(controller) {
    if (offset >= bytes.length) { controller.close(); return; }
    controller.enqueue(bytes.slice(offset, offset += size));
  } });
}
export const eventFrame = (sequence: number) => `id: ${sequence}\nevent: image_review_changed\ndata: ${JSON.stringify(event(sequence))}\n\n`;
