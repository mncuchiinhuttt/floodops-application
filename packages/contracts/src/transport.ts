import { IdSchema } from "./generated/schemas/id";
import { IfMatchParameterSchema } from "./generated/parameters";
import type { ErrorCode } from "./generated/schemas/error-code";
import { ContractValidationError } from "./validation";

export interface SessionVersion { session_id: string; generation: number; revision: number }
export function formatEtag(version: SessionVersion): string {
  IdSchema.parse(version.session_id);
  if (![version.generation, version.revision].every(v => Number.isSafeInteger(v) && v >= 0)) {
    throw new ContractValidationError("ETag", [{ path: "version", code: "invalid_version" }]);
  }
  return `"s:${version.session_id}:g:${version.generation}:r:${version.revision}"`;
}
export function parseEtag(value: string): SessionVersion {
  IfMatchParameterSchema.parse(value);
  const match = /^"s:([A-Za-z0-9_-]+):g:([0-9]+):r:([0-9]+)"$/.exec(value)!;
  const result = { session_id: match[1]!, generation: Number(match[2]), revision: Number(match[3]) };
  formatEtag(result);
  return result;
}
export const HTTP_ERROR_CATALOG = {
  400: "Malformed request", 401: "Missing or expired capability", 403: "Forbidden operation",
  404: "Resource not found in accessible scope", 409: "Conflict or key reuse",
  410: "Session expired/reset or cursor expired", 412: "Stale operational revision",
  413: "Body too large", 415: "Unsupported media type", 422: "Semantic validation or policy rejection",
  428: "Missing CAS precondition", 429: "Rate limited", 503: "Dependency unavailable",
} as const;
export type ErrorRecovery = "rejoin" | "refresh-view" | "replan" | "correct-input" | "retry-later" | "inspect-state";
export function errorRecovery(status: number, code: ErrorCode): ErrorRecovery {
  if (status === 412 || code === "STALE_PROPOSAL") return "replan";
  if (code === "EVENT_CURSOR_EXPIRED") return "refresh-view";
  if (status === 401 || status === 410) return "rejoin";
  if (status === 429 || status === 503) return "retry-later";
  if ([400, 413, 415, 422, 428].includes(status)) return "correct-input";
  return "inspect-state";
}
