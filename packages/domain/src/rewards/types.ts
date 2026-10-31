import type { Award, Coverage, Gap, Observation, Report, ScopePair, SegmentKnowledge, Source } from "@floodops/contracts";

/** Private server inputs/proposals, not wire DTOs or authorization grants. */
export interface CoverageScope extends ScopePair { knowledge_epoch: number }
export interface CoverageInput {
  readonly scope: readonly CoverageScope[];
  readonly knowledge: readonly SegmentKnowledge[];
  readonly observations: readonly Observation[];
  readonly sources: readonly Source[];
  readonly now_sim_minute: number;
}
export interface UsefulPair {
  readonly scope: CoverageScope;
  readonly observation_ids: readonly string[];
  readonly covered: boolean;
}
export interface UsefulCoverage { readonly coverage: Coverage; readonly pairs: readonly UsefulPair[] }
export interface PhotoClaim { readonly normalized_hash: string; readonly report_id: string; readonly contributor_id: string }
export interface RewardLedger {
  readonly session_id: string;
  readonly generation: number;
  readonly last_event_sequence: number;
  readonly gaps: readonly Gap[];
  readonly awards: readonly Award[];
  readonly photos: readonly PhotoClaim[];
}
export interface TransitionContext {
  readonly session_id: string;
  readonly generation: number;
  readonly event_sequence: number;
}
export interface GapIdentity extends CoverageScope { readonly gap_id: string }
export interface RewardConfig {
  readonly points_per_report: number;
  readonly eligible_source_ids: readonly string[];
}
/** Supplied only from server-owned normalized media; never a client hash. */
export interface VerifiedPhoto { readonly report_id: string; readonly normalized_hash: string; readonly ready: boolean }
export interface RewardInput {
  readonly before: CoverageInput;
  readonly after: CoverageInput;
  readonly report: Report;
  readonly photo: VerifiedPhoto | null;
  readonly config: RewardConfig;
  readonly context: TransitionContext & { readonly award_id: string; readonly awarded_at: string };
}
export type RewardReason = "AWARDED" | "ALREADY_AWARDED" | "DUPLICATE_IMAGE" | "NOT_ACCEPTED"
  | "MEDIA_NOT_READY" | "NOT_ELIGIBLE" | "CONFLICT" | "EXPIRED" | "VALID_BUT_REDUNDANT";
export interface RewardProposal {
  readonly ledger: RewardLedger;
  readonly new_award: Award | null;
  readonly filled_gap_ids: readonly string[];
  readonly reason: RewardReason;
}
export class RewardProposalError extends Error {
  override readonly name = "RewardProposalError";
  constructor(readonly code: "CONFIG_INCOMPLETE" | "INVALID_STATE" | "INVALID_CONTEXT" | "STALE_TRANSITION", message: string) { super(message); }
}
