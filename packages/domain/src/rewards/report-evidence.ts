import { IdSchema, ReportSchema, AwardSchema, validate } from "@floodops/contracts";
import type { Report } from "@floodops/contracts";
import type { CoverageInput, RewardInput, UsefulPair } from "./types.ts";
import { RewardProposalError } from "./types.ts";
import { scopeKey, unique } from "./validation.ts";
import { assertCoverageTransition } from "./coverage.ts";
import { currentScopeEvidence } from "./current-evidence.ts";

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
  const scopes = new Map([...input.after.scope, ...input.after.knowledge].filter(pair =>
    pair.segment_id === input.report.segment_id && input.report.vehicle_types.includes(pair.vehicle_type))
    .map(pair => [scopeKey(pair), pair]));
  return [...scopes.values()].some(scope => {
    const current = input.after.knowledge.find(item => scopeKey(item) === scopeKey(scope));
    if (current?.state === "unresolved_conflict") return true;
    const facts = currentScopeEvidence(input.after, scope);
    return new Set(facts.map(item => item.condition)).size > 1
      || (current?.state === "known" && facts.some(item => item.condition !== current.condition));
  });
}
export function isReportExpired(input: RewardInput): boolean {
  const observations = input.after.observations.filter(item => input.report.observation_ids.includes(item.observation_id));
  return observations.length > 0 && observations.every(item => item.expires_sim_minute <= input.after.now_sim_minute);
}
