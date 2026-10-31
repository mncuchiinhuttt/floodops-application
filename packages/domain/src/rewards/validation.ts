import { AwardSchema, GapSchema, IdSchema, ScopePairSchema, validate } from "@floodops/contracts";
import type { CoverageScope, RewardLedger, TransitionContext } from "./types.ts";
import { RewardProposalError } from "./types.ts";

export const scopeKey = (value: { segment_id: string; vehicle_type: string; knowledge_epoch: number }) =>
  JSON.stringify([value.segment_id, value.vehicle_type, value.knowledge_epoch]);
export function integer(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new RewardProposalError("INVALID_CONTEXT", `Invalid ${label}.`);
}
export function unique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new RewardProposalError("INVALID_STATE", `Duplicate ${label}.`);
}
export function validateCoverageScope(scope: readonly CoverageScope[]): void {
  for (const pair of scope) {
    validate(ScopePairSchema, { segment_id: pair.segment_id, vehicle_type: pair.vehicle_type }, "Coverage.scope");
    integer(pair.knowledge_epoch, "knowledge epoch");
  }
  unique(scope.map(item => JSON.stringify([item.segment_id, item.vehicle_type])), "relevant pair");
}
export function assertHash(hash: string): void {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new RewardProposalError("INVALID_STATE", "Expected server-normalized SHA256.");
}
export function immutable<T>(value: T): T {
  const copy = structuredClone(value);
  function freeze(item: unknown): void {
    if (item && typeof item === "object") { Object.values(item).forEach(freeze); Object.freeze(item); }
  }
  freeze(copy); return copy;
}
export function validateLedger(ledger: RewardLedger): void {
  validate(IdSchema, ledger.session_id, "RewardLedger.session_id");
  integer(ledger.generation, "generation"); integer(ledger.last_event_sequence, "event sequence");
  for (const gap of ledger.gaps) {
    validate(GapSchema, gap, "RewardLedger.gap");
    if (gap.opened_sequence > ledger.last_event_sequence || (gap.status === "open" && (gap.filled_by_report_id || gap.first_award_id))) {
      throw new RewardProposalError("INVALID_STATE", "Invalid gap history.");
    }
  }
  for (const award of ledger.awards) {
    validate(AwardSchema, award, "RewardLedger.award");
    unique(award.filled_gap_ids, "award gap");
    if (!ledger.photos.some(photo => photo.report_id === award.report_id && photo.contributor_id === award.contributor_id)) {
      throw new RewardProposalError("INVALID_STATE", "Award requires its contributor-bound normalized photo claim.");
    }
    if (award.event_sequence > ledger.last_event_sequence) throw new RewardProposalError("INVALID_STATE", "Future award.");
    for (const id of award.filled_gap_ids) {
      const gap = ledger.gaps.find(item => item.gap_id === id);
      if (!gap || gap.opened_sequence >= award.event_sequence || gap.status !== "filled"
        || gap.first_award_id !== award.award_id || gap.filled_by_report_id !== award.report_id) {
        throw new RewardProposalError("INVALID_STATE", "Award/gap mismatch.");
      }
    }
  }
  for (const gap of ledger.gaps) if (gap.first_award_id && !ledger.awards.some(award =>
    award.award_id === gap.first_award_id && award.filled_gap_ids.includes(gap.gap_id))) {
    throw new RewardProposalError("INVALID_STATE", "Missing first-fill award.");
  }
  for (const photo of ledger.photos) {
    assertHash(photo.normalized_hash);
    validate(IdSchema, photo.report_id, "PhotoClaim.report_id"); validate(IdSchema, photo.contributor_id, "PhotoClaim.contributor_id");
  }
  unique(ledger.gaps.map(item => item.gap_id), "gap id");
  unique(ledger.gaps.filter(item => item.status === "open").map(scopeKey), "open gap scope");
  unique(ledger.awards.map(item => item.award_id), "award id");
  unique(ledger.awards.map(item => item.report_id), "awarded report");
  unique(ledger.awards.flatMap(item => item.filled_gap_ids), "first-fill gap");
  unique(ledger.photos.map(item => item.normalized_hash), "normalized photo");
  unique(ledger.photos.map(item => item.report_id), "photo report");
}
export function assertContext(ledger: RewardLedger, context: TransitionContext): void {
  integer(context.event_sequence, "event sequence");
  if (context.session_id !== ledger.session_id || context.generation !== ledger.generation) {
    throw new RewardProposalError("INVALID_CONTEXT", "Session/generation binding differs.");
  }
  if (context.event_sequence < ledger.last_event_sequence) throw new RewardProposalError("STALE_TRANSITION", "Stale proposal sequence.");
}
export function finishTransition(ledger: RewardLedger, context: TransitionContext): RewardLedger {
  if (context.event_sequence <= ledger.last_event_sequence) throw new RewardProposalError("STALE_TRANSITION", "Mutation needs a new event sequence.");
  const next = { ...ledger, last_event_sequence: context.event_sequence };
  validateLedger(next); return immutable(next);
}
export function createRewardLedger(session_id: string, generation: number, event_sequence: number): RewardLedger {
  const ledger: RewardLedger = { session_id, generation, last_event_sequence: event_sequence, gaps: [], awards: [], photos: [] };
  validateLedger(ledger); return immutable(ledger);
}
