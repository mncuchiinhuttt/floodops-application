import type { Gap } from "@floodops/contracts";
import type { CoverageScope, RewardLedger } from "./types.ts";
import { immutable, scopeKey, validateCoverageScope, validateLedger } from "./validation.ts";

/** Current display/eligibility projection; historical rows retain their audit status. */
export function projectActiveGaps(ledger: RewardLedger, currentScope: readonly CoverageScope[]): readonly Gap[] {
  validateLedger(ledger); validateCoverageScope(currentScope);
  const keys = new Set(currentScope.map(scopeKey));
  return immutable(ledger.gaps.filter(gap => gap.status === "open" && keys.has(scopeKey(gap))));
}
