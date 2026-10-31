import { SimMinuteSchema } from "@floodops/contracts";
/** A simulation capture timestamp uses authorized scenario T0, never wall time. */
export function captureTime(t0: string, minute: number): string {
  SimMinuteSchema.parse(minute); const start = Date.parse(t0);
  if (!Number.isFinite(start) || !Number.isFinite(start + minute * 60_000)) throw new Error("Scenario capture time unavailable");
  return new Date(start + minute * 60_000).toISOString();
}
