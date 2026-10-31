import { ApiError, RequestCancelledError, TransportError, throwIfAborted } from "./errors";
import type { RetryPolicy } from "./types";

export function retryPolicy(input: Partial<RetryPolicy> = {}): RetryPolicy {
  const policy = { maxRetries: 2, baseDelayMs: 250, maxDelayMs: 30_000, ...input };
  if (!Number.isInteger(policy.maxRetries) || policy.maxRetries < 0 || policy.maxRetries > 3 ||
    !Number.isFinite(policy.baseDelayMs) || policy.baseDelayMs < 0 || policy.baseDelayMs > 30_000 ||
    !Number.isFinite(policy.maxDelayMs) || policy.maxDelayMs < policy.baseDelayMs || policy.maxDelayMs > 30_000) {
    throw new RangeError("GET retries must be bounded: 0..3 attempts after the first, delays <=30s");
  }
  return policy;
}
export function canRetry(error: unknown): boolean {
  return error instanceof TransportError || (error instanceof ApiError && [429, 503].includes(error.status) && error.response.error.retryable);
}
export function retryDelay(error: unknown, attempt: number, policy: RetryPolicy, random: () => number): number | null {
  const retryAfter = error instanceof ApiError ? error.retryAfterMs : null;
  if (retryAfter !== null && retryAfter > policy.maxDelayMs) return null;
  const r = random();
  if (!Number.isFinite(r) || r < 0 || r > 1) throw new RangeError("Invalid jitter source");
  return Math.max(retryAfter ?? 0, Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** attempt * (0.5 + r * 0.5)));
}
export function waitForRetry(ms: number, signal: AbortSignal): Promise<void> {
  throwIfAborted(signal);
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new RequestCancelledError()); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}
export function parseRetryAfter(value: string | null, now: number): number | null {
  if (value === null) return null;
  if (/^[0-9]+$/.test(value)) return Number.isFinite(Number(value)) ? Number(value) * 1000 : null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - now) : null;
}
