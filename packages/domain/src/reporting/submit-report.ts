import { SubmitReportInputSchema, ReportSchema } from "@floodops/contracts";
import type { Report } from "@floodops/contracts";
import { fail } from "../sources/source-types.ts";
import { receiptReward } from "./receipt-reward.ts";
import { bindReportIdentity } from "./report-identity.ts";
import { validateReportEvidence } from "./report-validation.ts";
import type { ReportContext } from "./report-types.ts";

/** Submit/normalization never accepts a citizen report, awards points, or commits knowledge. */
export function submitReport(raw: unknown, context: ReportContext): Report {
  const parsed = SubmitReportInputSchema.safeParse(raw);
  if (!parsed.success) fail("INVALID_SCHEMA");
  const input = parsed.data, entityId = bindReportIdentity(input, context);
  if (input.kind === "driver" && ((input.input_mode === "quick") !== (input.quick_condition !== null))) fail("INVALID_SCHEMA");
  const report: Report = { report_id: context.reportId, participant_id: context.participant.participant_id, kind: input.kind,
    segment_id: input.segment_id, coordinate: input.coordinate, captured_at: input.captured_at, captured_sim_minute: input.captured_sim_minute,
    received_at: context.receivedAt, vehicle_types: [...input.vehicle_types], description: input.description,
    media_id: input.kind === "citizen" ? input.media_id : null, fixture_photo_id: input.kind === "citizen" ? input.fixture_photo_id : null,
    status: "pending_review", reason_codes: [], observation_ids: [], award_id: null, input_revision: context.inputRevision,
    observation_candidates: [], input_mode: input.kind === "driver" ? input.input_mode : "photo",
    quick_condition: input.kind === "driver" ? input.quick_condition : null, reporter_entity_id: entityId,
    reward: receiptReward(input.kind, context.receiptRewardPolicy), review_result_id: null, reviewed_at: null };
  const validation = validateReportEvidence(report, context);
  report.segment_id = validation.segmentId;
  report.reason_codes = validation.reasons;
  if (validation.reasons.length) report.status = "needs_clarification";
  else if ((input.kind === "driver" && input.input_mode === "text")
    || (input.kind === "citizen" && input.media_id !== null && !context.media?.normalized)) report.status = "normalizing";
  return ReportSchema.parse(report);
}

/** Internal persistence proposal: save captured epochs beside the canonical wire report before review. */
export function proposeReportSubmission(raw: unknown, context: ReportContext) {
  const report = submitReport(raw, context);
  const capturedEpochs = context.epochs.filter(pair => pair.segment_id === report.segment_id && report.vehicle_types.includes(pair.vehicle_type))
    .map(pair => ({ segment_id: pair.segment_id, vehicle_type: pair.vehicle_type, knowledge_epoch: pair.knowledge_epoch }));
  if (report.status === "pending_review" && (capturedEpochs.length !== report.vehicle_types.length
    || new Set(capturedEpochs.map(pair => pair.vehicle_type)).size !== capturedEpochs.length)) fail("STALE_EPOCH");
  return { report, capturedEpochs, committed: false as const };
}
