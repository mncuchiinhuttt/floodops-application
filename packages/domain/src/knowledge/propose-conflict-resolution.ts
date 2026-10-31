import type { EvidenceContext } from "../sources/source-types.ts";
import { fail, uniqueIds } from "../sources/source-types.ts";
import { currentEvidence } from "./current-evidence.ts";
import type { KnowledgePair } from "./current-evidence.ts";
import { reconcileEvidence } from "./reconcile-evidence.ts";
import { deriveCurrentKnowledge } from "./derive-current-knowledge.ts";

/** Trusted review orchestration supplies explicit IDs and audit reason; this proposal commits nothing. */
export function proposeConflictResolution(input: { pair: KnowledgePair; pairs: readonly KnowledgePair[]; keepObservationIds: readonly string[];
  supersedeObservationIds: readonly string[]; reasonId: string }, context: EvidenceContext) {
  if (!input.reasonId.trim()) fail("INVALID_TRANSITION");
  const before = deriveCurrentKnowledge(input.pair, context);
  if (before.state !== "unresolved_conflict") fail("INVALID_TRANSITION");
  const current = currentEvidence(input.pair, context), all = [...input.keepObservationIds, ...input.supersedeObservationIds];
  uniqueIds(all);
  if (!input.keepObservationIds.length || !input.supersedeObservationIds.length || all.length !== current.length
    || current.some(item => !all.includes(item.observation_id))) fail("INVALID_TRANSITION");
  const kept = current.filter(item => input.keepObservationIds.includes(item.observation_id));
  if (new Set(kept.map(item => item.condition)).size !== 1) fail("INVALID_TRANSITION");
  const observations = context.observations.map(item => ({ ...structuredClone(item),
    validation: input.supersedeObservationIds.includes(item.observation_id) ? "superseded" : item.validation }));
  const reconciled = reconcileEvidence(input.pairs, { ...context, observations });
  const resolvedKnowledge = reconciled.knowledge.find(pair => pair.segment_id === input.pair.segment_id && pair.vehicle_type === input.pair.vehicle_type);
  if (!resolvedKnowledge || resolvedKnowledge.knowledge_epoch !== input.pair.knowledge_epoch) fail("INVALID_TRANSITION");
  return { kind: "proposed" as const, reasonId: input.reasonId, ...reconciled, resolvedKnowledge, committed: false as const };
}
