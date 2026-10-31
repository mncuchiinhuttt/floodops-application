import type { EvidenceContext } from "../sources/source-types.ts";
import type { KnowledgePair } from "./current-evidence.ts";
import { deriveKnowledgeSnapshot } from "./derive-current-knowledge.ts";
import { fail } from "../sources/source-types.ts";

/** Supply ALL authoritative pairs: a multi-vehicle observation can affect more than the reviewed pair. */
export function reconcileEvidence(pairs: readonly KnowledgePair[], context: EvidenceContext) {
  for (const item of context.observations) if (item.validation === "accepted" && item.observed_sim_minute <= context.nowSimMinute
    && context.nowSimMinute < item.expires_sim_minute && item.vehicle_types.some(vehicle => !pairs.some(pair =>
      pair.segment_id === item.segment_id && pair.vehicle_type === vehicle))) fail("INVALID_TRANSITION");
  const knowledge = deriveKnowledgeSnapshot(pairs, context);
  const observations = context.observations.map(item => ({ ...structuredClone(item), has_conflict: knowledge.some(pair =>
    pair.state === "unresolved_conflict" && pair.observation_ids.includes(item.observation_id)) }));
  return { knowledge, observations };
}
