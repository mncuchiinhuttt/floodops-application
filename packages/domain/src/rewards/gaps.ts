import { IdSchema, validate } from "@floodops/contracts";
import type { CoverageInput, GapIdentity, RewardLedger, TransitionContext } from "./types.ts";
import { RewardProposalError } from "./types.ts";
import { assertCoverageTransition, deriveUsefulCoverage } from "./coverage.ts";
import { assertContext, finishTransition, immutable, scopeKey, unique, validateLedger } from "./validation.ts";

/** Opens new occurrences only; IDs and event sequence come from the server caller. */
export function proposeGapOpenings(ledger: RewardLedger, input: CoverageInput, context: TransitionContext,
  identities: readonly GapIdentity[]): RewardLedger {
  validateLedger(ledger); assertContext(ledger, context);
  const coverage = deriveUsefulCoverage(input);
  unique(identities.map(scopeKey), "allocated gap scope"); unique(identities.map(item => item.gap_id), "allocated gap id");
  for (const identity of identities) validate(IdSchema, identity.gap_id, "GapIdentity.gap_id");
  const missing = coverage.pairs.filter(pair => !pair.covered && !ledger.gaps.some(gap =>
    gap.status === "open" && scopeKey(gap) === scopeKey(pair.scope)));
  if (!missing.length) return immutable(ledger);
  const openings = missing.map(pair => {
    const identity = identities.find(item => scopeKey(item) === scopeKey(pair.scope));
    if (!identity || ledger.gaps.some(gap => gap.gap_id === identity.gap_id)) {
      throw new RewardProposalError("INVALID_CONTEXT", "Each new occurrence needs an unused server gap ID.");
    }
    return { gap_id: identity.gap_id, ...pair.scope, opened_sequence: context.event_sequence,
      status: "open" as const, filled_by_report_id: null, first_award_id: null };
  });
  return finishTransition({ ...ledger, gaps: [...ledger.gaps, ...openings] }, context);
}

/** Non-report source recovery fills gaps without a report pointer or reward. */
export function proposeSourceGapFills(ledger: RewardLedger, before: CoverageInput, after: CoverageInput,
  context: TransitionContext): RewardLedger {
  validateLedger(ledger); assertContext(ledger, context); assertCoverageTransition(before, after);
  const previous = deriveUsefulCoverage(before), current = deriveUsefulCoverage(after);
  const gains = current.pairs.filter(pair => pair.covered && previous.pairs.some(old =>
    scopeKey(old.scope) === scopeKey(pair.scope) && !old.covered) && pair.observation_ids.some(id => {
    const observation = after.observations.find(item => item.observation_id === id)!;
    const source = after.sources.find(item => item.source_id === observation.source_id)!;
    return source.source_type !== "community" && source.source_type !== "driver";
  }));
  const filled = ledger.gaps.filter(gap => gap.status === "open" && gains.some(pair => scopeKey(pair.scope) === scopeKey(gap)));
  if (!filled.length) return immutable(ledger);
  return finishTransition({ ...ledger, gaps: ledger.gaps.map(gap => filled.includes(gap)
    ? { ...gap, status: "filled" as const, filled_by_report_id: null, first_award_id: null } : gap) }, context);
}
