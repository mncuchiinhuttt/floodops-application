import { errorRecovery, type ErrorResponse } from "@floodops/contracts";

export class ApiError extends Error {
  override readonly name = "ApiError";
  readonly recovery;
  constructor(readonly status: number, readonly response: ErrorResponse, readonly retryAfterMs: number | null) {
    super(`FloodOps API error: ${response.error.code}`);
    this.recovery = errorRecovery(status, response.error.code);
  }
}
export class TransportError extends Error {
  override readonly name = "TransportError";
  constructor() { super("FloodOps transport interrupted"); }
}
export class RequestCancelledError extends Error {
  override readonly name = "AbortError";
  constructor() { super("FloodOps request cancelled"); }
}
export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new RequestCancelledError();
}
