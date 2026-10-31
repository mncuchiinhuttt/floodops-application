import { ContractValidationError, type ErrorCode } from "@floodops/contracts";
import type { Reply, Snapshot } from "./platform-types";
export class PlatformError extends Error {
  constructor(readonly status: number, readonly code: ErrorCode, message = code as string,
    readonly snapshot?: Snapshot, readonly retryAfter?: number) { super(message); }
}
export function fail(status: number, code: ErrorCode, snapshot?: Snapshot): never {
  throw new PlatformError(status, code, code, snapshot);
}
export function metadata(requestId: string, snapshot?: Snapshot): Record<string, unknown> {
  const m = snapshot?.meta;
  return { request_id: requestId, ...(m ? { session_id: m.session_id, generation: m.generation, revision: m.revision, event_sequence: m.event_sequence } : {}) };
}
export function success(status: number, data: unknown, requestId: string, snapshot?: Snapshot): Reply {
  return { status, body: { success: true, data, error: null, meta: metadata(requestId, snapshot) } };
}
export function normalizeError(error: unknown): PlatformError {
  return error instanceof PlatformError ? error : error instanceof ContractValidationError || (error instanceof Error && error.name === "ZodError")
    ? new PlatformError(422, "INVALID_SCHEMA") : new PlatformError(503, "STORAGE_UNAVAILABLE");
}
export function errorReply(error: unknown, requestId: string): Reply {
  const e = normalizeError(error);
  return { status: e.status, retryAfter: e.retryAfter, body: { success: false, data: null,
    error: { code: e.code, message: e.message, details: [], retryable: e.status === 429 || e.status === 503,
      current_revision: e.snapshot?.meta.revision ?? null,
      replacement_session_id: e.code === "SESSION_RESET" ? e.snapshot?.values.replacement_session_id ?? null : null },
    meta: metadata(requestId, e.snapshot) } };
}
