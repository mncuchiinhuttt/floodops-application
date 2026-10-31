/** Synthetic typed transport fixtures only; not image normalization evidence. */
import { ApiError, type FetchAdapter } from "@floodops/api-client";
import { MediaSchema } from "@floodops/contracts";
import { WebRuntime } from "../src/app/runtime";
import { identity, now, session } from "./fixtures";
export const media = MediaSchema.parse({ media_id: "media_test001", status: "ready", content_type: "image/png", byte_length: 3,
  width: 64, height: 48, sha256: "a".repeat(64), created_at: "2026-10-31T00:00:00Z" });
export const upload = { upload_id: "upload_test001", status: "reserved", expires_at: session.expires_at, maximum_bytes: 5242880, content_path: "https://not-a-safe-image.invalid/quarantine" };
export const meta = { request_id: "test-upload", session_id: session.session_id, generation: 1, revision: 4, event_sequence: 8 };
export const success = (data: unknown, status: number) => Response.json({ success: true, data, error: null, meta }, { status });
export function normalResponse(input: string) {
  return input.endsWith("/completion") ? success(media, 201) : input.endsWith("/content") ? success({ ...upload, status: "uploaded" }, 200) : success(upload, 201);
}
export function file(bytes: number[] = [1, 2, 3]) {
  return { name: "synthetic.png", type: "image/png", size: bytes.length, arrayBuffer: async () => new Uint8Array(bytes).buffer };
}
export function uploadRuntime(fetch: FetchAdapter) {
  const runtime = new WebRuntime({ baseUrl: "/api/v1", fetch, now: () => now }), current = identity("dispatcher");
  current.participant.permissions.push("media:write", "reports:submit", "simulation:submit_as"); current.csrf_token = "c".repeat(32); runtime.adopt(current); return runtime;
}
export function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
export function processingFailure() {
  return Response.json({ success: false, data: null, error: { code: "MEDIA_PROCESSING_UNAVAILABLE", message: "not normalized", details: [], retryable: true, current_revision: null, replacement_session_id: null }, meta }, { status: 503 });
}
export { ApiError };
