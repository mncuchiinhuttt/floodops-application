import { ApiError, RequestCancelledError, TransportError } from "@floodops/api-client";
import { ContractValidationError } from "@floodops/contracts";
export interface ClientFailure { message: string; next: "rejoin" | "refresh" | "replan" | "correct" | "retry-explicitly" | "inspect" }
export function clientFailure(error: unknown): ClientFailure {
  if (error instanceof ContractValidationError && error.boundary.endsWith(".request")) return { message: "Check the report or command fields before sending explicitly.", next: "correct" };
  if (error instanceof ContractValidationError) return { message: "Server data does not match the M1 contract. Inspect the outcome; legacy data requires a new session or explicit Reset. No data was upgraded locally.", next: "inspect" };
  if (error instanceof RequestCancelledError) return { message: "Request cancelled. Refresh the current session.", next: "refresh" };
  if (error instanceof TransportError) return { message: "Connection interrupted. The command outcome is uncertain; inspect server state before sending again.", next: "inspect" };
  if (error instanceof ApiError) {
    if ([401, 403, 410].includes(error.status)) return { message: "Capability unavailable or session changed. Rejoin explicitly.", next: "rejoin" };
    if (error.status === 412 || error.recovery === "replan") return { message: "Needs replan. Refresh; do not resend the old command.", next: "replan" };
    if (error.status === 409) return { message: "Domain conflict. Inspect the current server state before another action.", next: "inspect" };
    if (error.recovery === "correct-input") return { message: `Server validation: ${error.response.error.code}. Input is preserved.`, next: "correct" };
    if (error.recovery === "retry-later") return { message: "Service unavailable or rate limited. Retry only with an explicit action.", next: "retry-explicitly" };
    return { message: "Refresh the authorized server view.", next: "refresh" };
  }
  return { message: "Action unavailable. Inspect current state; your input is preserved.", next: "inspect" };
}
