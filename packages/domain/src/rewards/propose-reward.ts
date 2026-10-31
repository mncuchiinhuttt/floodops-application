import { AwardSchema, validate } from "@floodops/contracts";
import type { Award } from "@floodops/contracts";
import { deriveUsefulCoverage } from "./coverage.ts";
import { hasReportConflict, isReportExpired, reportEvidence, validateRewardInput } from "./report-evidence.ts";
import type { RewardInput, RewardLedger, RewardProposal, RewardReason } from "./types.ts";
import { RewardProposalError } from "./types.ts";
import { assertContext, assertHash, finishTransition, immutable, scopeKey, validateLedger } from "./validation.ts";

/** A candidate only. The durable owner must atomically commit it with accepted knowledge. */
export function proposeReportReward(ledger: RewardLedger, input: RewardInput): RewardProposal {
  validateLedger(ledger); validateRewardInput(input); assertContext(ledger, input.context);
  const before = deriveUsefulCoverage(input.before), after = deriveUsefulCoverage(input.after);
  const { report, photo, config, context } = input;
  const unchanged = (reason: RewardReason): RewardProposal => immutable({ ledger, reason, new_award: null, filled_gap_ids: [] });
  if (report.status !== "accepted") return unchanged("NOT_ACCEPTED");
  const existingAward = ledger.awards.find(item => item.report_id === report.report_id);
  if (report.award_id !== null && existingAward?.award_id !== report.award_id) {
    throw new RewardProposalError("INVALID_STATE", "Report award pointer differs from the ledger.");
  }
  const isCitizenPhoto = report.kind === "citizen" && report.input_mode === "photo" && (report.media_id !== null || report.fixture_photo_id !== null);
  let newPhoto = null;
  if (isCitizenPhoto) {
    if (!photo || !photo.ready) return unchanged("MEDIA_NOT_READY");
    if (photo.report_id !== report.report_id) throw new RewardProposalError("INVALID_CONTEXT", "Photo/report binding differs.");
    assertHash(photo.normalized_hash);
    const sameReport = ledger.photos.find(item => item.report_id === report.report_id);
    if (sameReport && (sameReport.normalized_hash !== photo.normalized_hash || sameReport.contributor_id !== report.reporter_entity_id)) {
      throw new RewardProposalError("INVALID_STATE", "Accepted report/photo identity is immutable.");
    }
    if (ledger.photos.some(item => item.normalized_hash === photo.normalized_hash && item.report_id !== report.report_id)) {
      return unchanged("DUPLICATE_IMAGE");
    }
    if (!sameReport) newPhoto = { normalized_hash: photo.normalized_hash, report_id: report.report_id, contributor_id: report.reporter_entity_id };
  }
  const filled = hasReportConflict(input) ? [] : after.pairs.filter(pair => pair.covered && before.pairs.some(previous =>
    scopeKey(previous.scope) === scopeKey(pair.scope) && !previous.covered) && reportEvidence(report, pair, input.after).length > 0);
  const filledGaps = ledger.gaps.filter(gap => gap.status === "open" && filled.some(pair => scopeKey(pair.scope) === scopeKey(gap)));
  const rewardedGaps = isCitizenPhoto ? filledGaps.filter(gap => filled.some(pair => scopeKey(pair.scope) === scopeKey(gap)
    && reportEvidence(report, pair, input.after).some(observation => config.eligible_source_ids.includes(observation.source_id)
      && input.after.sources.some(source => source.source_id === observation.source_id && source.source_type === "community")))) : [];
  let new_award: Award | null = null;
  if (!existingAward && rewardedGaps.length) {
    if (ledger.awards.some(item => item.award_id === context.award_id)) throw new RewardProposalError("INVALID_CONTEXT", "Award ID already allocated.");
    new_award = validate(AwardSchema, { award_id: context.award_id, report_id: report.report_id, contributor_id: report.reporter_entity_id,
      filled_gap_ids: rewardedGaps.map(gap => gap.gap_id), points: config.points_per_report, event_sequence: context.event_sequence,
      awarded_at: context.awarded_at, is_simulated: true }, "RewardProposal.award");
  }
  const award = new_award;
  const gaps = ledger.gaps.map(gap => filledGaps.includes(gap) ? { ...gap, status: "filled" as const,
    filled_by_report_id: report.report_id, first_award_id: award?.filled_gap_ids.includes(gap.gap_id) ? award.award_id : null } : gap);
  const changed = filledGaps.length > 0 || newPhoto !== null || new_award !== null;
  const next = changed ? finishTransition({ ...ledger, gaps, photos: newPhoto ? [...ledger.photos, newPhoto] : ledger.photos,
    awards: new_award ? [...ledger.awards, new_award] : ledger.awards }, context) : immutable(ledger);
  const reason: RewardReason = new_award ? "AWARDED" : existingAward ? "ALREADY_AWARDED"
    : hasReportConflict(input) ? "CONFLICT" : isReportExpired(input) ? "EXPIRED"
    : !isCitizenPhoto || config.eligible_source_ids.length === 0 || (filledGaps.length > 0 && rewardedGaps.length === 0) ? "NOT_ELIGIBLE"
    : "VALID_BUT_REDUNDANT";
  return immutable({ ledger: next, new_award, filled_gap_ids: filledGaps.map(gap => gap.gap_id), reason });
}
