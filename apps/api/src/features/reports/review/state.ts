import { parseSchema } from "@floodops/contracts";
import type { Conflict, Gap, SegmentKnowledge } from "@floodops/contracts";
import { createRewardLedger, deriveUsefulCoverage, proposeGapOpenings, validateLedger } from "@floodops/domain/rewards";
import type { CoverageInput, RewardLedger } from "@floodops/domain/rewards";
import { SourceDomainError } from "@floodops/domain/sources";
import { RewardProposalError } from "@floodops/domain/rewards";
import { fail } from "../../../shared/index";
import type { TransitionContext } from "../../../shared/index";
import type { ReviewSourceState, ReviewStore } from "./runtime-types";

export function reviewId(prefix: string): string { return `${prefix}_${crypto.randomUUID()}`; }
/** Called by the genuine scenario/source seed loader, before any review transition. */
export function createReviewSeed(input: CoverageInput, id = reviewId): { gaps: Gap[] } {
  return { gaps: deriveUsefulCoverage(input).pairs.filter(pair => !pair.covered).map(pair => parseSchema("Gap", {
    ...pair.scope, gap_id: id("gap"), opened_sequence: 0, status: "open", filled_by_report_id: null, first_award_id: null,
  })) };
}
export function readReviewStore(context: TransitionContext): ReviewStore {
  const value = context.snapshot.values.reviewRewards as ReviewStore | undefined;
  if (value) {
    validateLedger(value.ledger);
    if (value.ledger.session_id !== context.snapshot.meta.session_id || value.ledger.generation !== context.snapshot.meta.generation) fail(409, "STATE_CONFLICT");
    return structuredClone(value);
  }
  const seed = context.snapshot.seed.values.reviewRewardsSeed as { gaps?: unknown[] } | undefined;
  if (!seed || !Array.isArray(seed.gaps)) fail(503, "CONFIG_INCOMPLETE");
  const ledger = { ...createRewardLedger(context.snapshot.meta.session_id, context.snapshot.meta.generation, 0),
    gaps: seed.gaps.map(gap => parseSchema("Gap", gap)) };
  validateLedger(ledger); return { ledger, audit: [] };
}
export function coverageState(context: TransitionContext, state: ReviewSourceState): CoverageInput {
  if (state.evidence.nowSimMinute !== context.snapshot.meta.sim_minute) fail(503, "CONFIG_INCOMPLETE");
  return { scope: state.relevantScope, knowledge: state.knowledge, observations: state.evidence.observations,
    sources: state.evidence.sources, now_sim_minute: state.evidence.nowSimMinute };
}
export function sourceFailure(error: unknown): never {
  if (error instanceof SourceDomainError) {
    if (error.code === "FORBIDDEN") fail(403, "FORBIDDEN");
    if (error.code === "CONFIG_INCOMPLETE" || error.code === "SOURCE_SCOPE_INCOMPATIBLE") fail(503, "CONFIG_INCOMPLETE");
    if (error.code === "DUPLICATE_IMAGE") fail(422, "DUPLICATE_IMAGE");
    if (error.code === "INVALID_IMAGE") fail(422, "INVALID_IMAGE");
    if (error.code === "INVALID_SCHEMA") fail(422, "INVALID_SCHEMA");
    fail(409, "STATE_CONFLICT");
  }
  if (error instanceof RewardProposalError) fail(error.code === "CONFIG_INCOMPLETE" ? 503 : 409,
    error.code === "CONFIG_INCOMPLETE" ? "CONFIG_INCOMPLETE" : "STATE_CONFLICT");
  throw error;
}

export function openCurrentGaps(context: TransitionContext, ledger: RewardLedger, input: CoverageInput, sequence: number, id = reviewId): RewardLedger {
  return proposeGapOpenings(ledger, input, { session_id: context.snapshot.meta.session_id, generation: context.snapshot.meta.generation,
    event_sequence: sequence }, input.scope.map(scope => ({ ...scope, gap_id: id("gap") })));
}
export function currentConflicts(previous: readonly Conflict[], knowledge: readonly SegmentKnowledge[], id = reviewId): Conflict[] {
  const conflicts = structuredClone([...previous]);
  for (const pair of knowledge.filter(item => item.state === "unresolved_conflict")) {
    const existing = conflicts.find(item => item.status === "unresolved" && item.segment_id === pair.segment_id
      && item.vehicle_type === pair.vehicle_type && item.knowledge_epoch === pair.knowledge_epoch);
    if (existing) existing.observation_ids = [...pair.observation_ids];
    else conflicts.push(parseSchema("Conflict", { conflict_id: id("conflict"), segment_id: pair.segment_id,
      vehicle_type: pair.vehicle_type, knowledge_epoch: pair.knowledge_epoch, observation_ids: pair.observation_ids,
      status: "unresolved", resolution_reason: null }));
  }
  return conflicts;
}

/** Compose inside the genuine source/clock reducer after new time/epoch/knowledge is derived. */
export function reconcileReviewGaps(context: TransitionContext, input: CoverageInput,
  eventSequence = context.snapshot.meta.event_sequence + 1): ReviewStore {
  const store = readReviewStore(context);
  return { ...store, ledger: openCurrentGaps(context, store.ledger, input, eventSequence) };
}
