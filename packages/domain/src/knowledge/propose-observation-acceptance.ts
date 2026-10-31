import { ConditionSchema, ObservationSchema, ReportSchema } from "@floodops/contracts";
import type { Condition, Observation, Report, VehicleType } from "@floodops/contracts";
import type { EvidenceContext } from "../sources/source-types.ts";
import { fail, uniqueIds } from "../sources/source-types.ts";
import { profileFor, sourceFor } from "../sources/source-policy.ts";
import { simTimestamp } from "../sources/source-time.ts";
import { validateReportEvidence } from "../reporting/report-validation.ts";
import { bindReportIdentity } from "../reporting/report-identity.ts";
import type { ReportContext } from "../reporting/report-types.ts";
import type { KnowledgePair } from "./current-evidence.ts";
import { reconcileEvidence } from "./reconcile-evidence.ts";

export interface ObservationAcceptanceContext extends ReportContext, EvidenceContext {
  readonly observationId?: string;
  readonly observationIds?: readonly { readonly vehicle_type: VehicleType; readonly observation_id: string }[];
  readonly reasonId: string;
}
function sameFacts(a: Observation, b: Observation): boolean {
  return Object.keys(a).filter(key => key !== "has_conflict").every(key =>
    JSON.stringify(a[key as keyof Observation]) === JSON.stringify(b[key as keyof Observation]));
}
/** Pure proposal. Runtime authorizes reviewer and fences session/generation/current CAS at atomic commit. */
export function proposeObservationAcceptance(report: Report, condition: Condition,
  pairs: readonly KnowledgePair[], context: ObservationAcceptanceContext) {
  if (!ReportSchema.safeParse(report).success || !ConditionSchema.safeParse(condition).success) fail("INVALID_SCHEMA");
  if (!context.reasonId.trim() || report.participant_id !== context.participant.participant_id
    || report.report_id !== context.reportId || report.input_revision > context.inputRevision) fail("INVALID_TRANSITION");
  if (bindReportIdentity(report, context) !== report.reporter_entity_id) fail("FORBIDDEN");
  const check = validateReportEvidence(report, context);
  if (check.segmentId === null) fail("INVALID_TRANSITION");
  if (report.media_id !== null && !context.media?.normalized) fail("INVALID_IMAGE");
  if (report.kind === "driver" && report.input_mode === "quick" && report.quick_condition !== condition) fail("INVALID_TRANSITION");
  uniqueIds(report.vehicle_types);
  const profile = profileFor(context, sourceFor(context, context.sourceId));
  const scoped = report.vehicle_types.map(vehicle => pairs.find(pair => pair.segment_id === check.segmentId && pair.vehicle_type === vehicle));
  if (!scoped.length || scoped.some(pair => !pair)) fail("STALE_EPOCH");
  for (const pair of scoped) if (!context.epochs.some(epoch => epoch.segment_id === pair!.segment_id
    && epoch.vehicle_type === pair!.vehicle_type && epoch.knowledge_epoch === pair!.knowledge_epoch)) fail("STALE_EPOCH");
  const bindings = context.observationIds ?? (report.vehicle_types.length === 1 && context.observationId
    ? [{ vehicle_type: report.vehicle_types[0]!, observation_id: context.observationId }] : []);
  if (bindings.length !== report.vehicle_types.length || report.vehicle_types.some(vehicle => !bindings.some(item => item.vehicle_type === vehicle))) fail("CONFIG_INCOMPLETE");
  uniqueIds(bindings.map(item => item.observation_id));
  const candidates = scoped.map(pair => ObservationSchema.parse({ observation_id: bindings.find(item => item.vehicle_type === pair!.vehicle_type)!.observation_id,
    source_id: context.sourceId, segment_id: check.segmentId, knowledge_epoch: pair!.knowledge_epoch, vehicle_types: [pair!.vehicle_type], condition,
    validation: "accepted", confidence_band: profile.confidence_band, observed_at: report.captured_at,
    observed_sim_minute: report.captured_sim_minute, expires_at: simTimestamp(context.t0, report.captured_sim_minute + profile.ttl_sim_minute!),
    expires_sim_minute: report.captured_sim_minute + profile.ttl_sim_minute!, evidence_ids: [report.report_id], has_conflict: false }));
  const previous = context.observations.filter(item => item.evidence_ids.includes(report.report_id));
  if (previous.length || candidates.some(candidate => context.observations.some(item => item.observation_id === candidate.observation_id))) {
    if (previous.length !== candidates.length || !["accepted", "pending_review"].includes(report.status)
      || candidates.some(candidate => !previous.some(item => item.observation_id === candidate.observation_id && sameFacts(item, candidate)))) fail("INVALID_TRANSITION");
    return { kind: "redelivery" as const, report: structuredClone(report), ...reconcileEvidence(pairs, context), committed: false as const };
  }
  if (check.reasons.length || report.status !== "pending_review") fail("INVALID_TRANSITION");
  const reconciled = reconcileEvidence(pairs, { ...context, observations: [...structuredClone(context.observations), ...candidates] });
  return { kind: "proposed" as const, reasonId: context.reasonId, report: { ...structuredClone(report), status: "accepted" as const,
    reason_codes: ["ACCEPTED" as const], observation_ids: candidates.map(item => item.observation_id), observation_candidates: [], award_id: null },
    ...reconciled, committed: false as const };
}
