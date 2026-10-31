import { ReportSchema } from "@floodops/contracts";
import type { Report, ReportReason } from "@floodops/contracts";
import type { ReportContext } from "./report-types.ts";
import { fail, SourceDomainError } from "../sources/source-types.ts";
import { profileFor, sourceFor, validateRegistry } from "../sources/source-policy.ts";
import { assertMappedTime, simTimestamp } from "../sources/source-time.ts";
import { resolveReportLocation } from "../sources/location.ts";

export function validateReportEvidence(report: Report, context: ReportContext): { segmentId: string | null; reasons: ReportReason[] } {
  if (!ReportSchema.safeParse(report).success) fail("INVALID_SCHEMA");
  validateRegistry(context);
  const source = sourceFor(context, context.sourceId), profile = profileFor(context, source);
  if (source.role !== "observation" || source.source_type !== (report.kind === "driver" ? "driver" : "community")) fail("SOURCE_ROLE_MISMATCH");
  if (profile.ttl_sim_minute === null || profile.location_tolerance_m === null) fail("CONFIG_INCOMPLETE");
  assertMappedTime(context.t0, report.captured_at, report.captured_sim_minute);
  if ((!Number.isFinite(Date.parse(report.received_at))) || Date.parse(report.received_at) > Date.parse(simTimestamp(context.t0, context.nowSimMinute))
    || (report.captured_sim_minute <= context.nowSimMinute && Date.parse(report.received_at) < Date.parse(report.captured_at))) fail("INVALID_TIME");
  const reasons: ReportReason[] = [];
  if (report.captured_sim_minute > context.nowSimMinute) reasons.push("FUTURE_CAPTURE");
  if (report.captured_sim_minute + profile.ttl_sim_minute <= context.nowSimMinute) reasons.push("EXPIRED");
  let segmentId: string | null = null;
  try { segmentId = resolveReportLocation(report, context.graph, profile.location_tolerance_m); }
  catch (error) {
    if (!(error instanceof SourceDomainError) || !["UNKNOWN_SEGMENT", "LOCATION_MISMATCH", "NEEDS_CLARIFICATION"].includes(error.code)) throw error;
    reasons.push(error.code as ReportReason);
  }
  if (report.kind === "citizen") {
    if ((report.media_id === null) === (report.fixture_photo_id === null)) reasons.push("INVALID_IMAGE");
    if (report.fixture_photo_id !== null && (!source.is_simulated || !context.fixtureAssets.some(item => item.fixture_photo_id === report.fixture_photo_id))) reasons.push("INVALID_IMAGE");
    if (report.media_id !== null && (!context.media || context.media.media_id !== report.media_id)) reasons.push("INVALID_IMAGE");
    if (report.media_id !== null && context.media?.duplicate) reasons.push("DUPLICATE_IMAGE");
  }
  return { segmentId, reasons };
}
