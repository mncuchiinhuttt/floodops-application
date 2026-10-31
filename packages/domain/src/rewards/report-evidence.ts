import { IdSchema, ReportSchema, AwardSchema, validate } from "@floodops/contracts";
import type { Report } from "@floodops/contracts";
import type { CoverageInput, RewardInput, UsefulPair } from "./types.ts";
import { RewardProposalError } from "./types.ts";
import { unique } from "./validation.ts";
import { assertCoverageTransition } from "./coverage.ts";

export function validateRewardInput(input: RewardInput): void {
  const config = input.config;
  if (!config || !Number.isSafeInteger(config.points_per_report) || config.points_per_report < 1
    || !Array.isArray(config.eligible_source_ids)) {
    throw new RewardProposalError("CONFIG_INCOMPLETE", "Explicit award points and eligible source IDs required.");
  }
  unique(config.eligible_source_ids, "eligible source");
  for (const id of config.eligible_source_ids) validate(IdSchema, id, "RewardConfig.eligible_source_ids");
  validate(ReportSchema, input.report, "RewardInput.report");
  validate(IdSchema, input.context.award_id, "RewardInput.award_id");
  validate(AwardSchema.shape.awarded_at, input.context.awarded_at, "RewardInput.awarded_at");
  assertCoverageTransition(input.before, input.after);
  unique(input.report.observation_ids, "report observation"); unique(input.report.vehicle_types, "report vehicle");
}
/** Evidence is attributed by both canonical observation IDs and server report linkage. */
export function reportEvidence(report: Report, pair: UsefulPair, input: CoverageInput) {
  if (report.segment_id !== pair.scope.segment_id || !report.vehicle_types.includes(pair.scope.vehicle_type)) return [];
  return input.observations.filter(item => pair.observation_ids.includes(item.observation_id)
    && report.observation_ids.includes(item.observation_id) && item.evidence_ids.includes(report.report_id)
    && item.observed_sim_minute === report.captured_sim_minute);
}
export function hasReportConflict(input: RewardInput): boolean {
  return input.after.observations.some(item => input.report.observation_ids.includes(item.observation_id)
    && item.has_conflict && item.validation === "accepted" && item.segment_id === input.report.segment_id
    && item.observed_sim_minute <= input.after.now_sim_minute && input.after.now_sim_minute < item.expires_sim_minute
    && input.after.knowledge.some(current => current.segment_id === item.segment_id && current.knowledge_epoch === item.knowledge_epoch
      && item.vehicle_types.includes(current.vehicle_type) && input.report.vehicle_types.includes(current.vehicle_type)))
    || input.after.knowledge.some(item => item.segment_id === input.report.segment_id
      && input.report.vehicle_types.includes(item.vehicle_type) && item.state === "unresolved_conflict");
}
export function isReportExpired(input: RewardInput): boolean {
  const observations = input.after.observations.filter(item => input.report.observation_ids.includes(item.observation_id));
  return observations.length > 0 && observations.every(item => item.expires_sim_minute <= input.after.now_sim_minute);
}
