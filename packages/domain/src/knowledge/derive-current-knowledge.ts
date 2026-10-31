import { SegmentKnowledgeSchema } from "@floodops/contracts";
import type { SegmentKnowledge } from "@floodops/contracts";
import { fail } from "../sources/source-types.ts";
import type { EvidenceContext } from "../sources/source-types.ts";
import { validateRegistry } from "../sources/source-policy.ts";
import { assertClock } from "../sources/source-time.ts";
import { activeClosures, currentEvidence } from "./current-evidence.ts";
import type { KnowledgePair } from "./current-evidence.ts";

/** Derives a projection only. Epoch is supplied by authoritative incident state, never inferred from geometry. */
export function deriveCurrentKnowledge(pair: KnowledgePair, context: EvidenceContext): SegmentKnowledge {
  validateRegistry(context); assertClock(context.t0, context.nowSimMinute);
  const base = { ...pair, condition: "unknown" as const, confidence_band: null, state: "ordinary_unknown" as const,
    observation_ids: [], restriction_ids: [], expires_sim_minute: null };
  if (!SegmentKnowledgeSchema.safeParse(base).success) fail("INVALID_SCHEMA");
  if (!context.graph.segments.some(edge => edge.segment_id === pair.segment_id && edge.allowed_vehicle_types.includes(pair.vehicle_type))) fail("UNKNOWN_SEGMENT");
  const closures = activeClosures(pair, context);
  const observations = currentEvidence(pair, context);
  if (closures.length) return { ...base, state: "authoritative_closed", condition: "impassable",
    restriction_ids: closures.map(item => item.restriction_id).sort() };
  const ids = observations.map(item => item.observation_id).sort();
  if (new Set(observations.map(item => item.condition)).size > 1) return { ...base, state: "unresolved_conflict",
    observation_ids: ids, expires_sim_minute: Math.min(...observations.map(item => item.expires_sim_minute)) };
  const preferred = [...observations].sort((a, b) => Number(b.confidence_band === "high") - Number(a.confidence_band === "high")
    || b.observed_sim_minute - a.observed_sim_minute || (a.observation_id < b.observation_id ? -1 : a.observation_id > b.observation_id ? 1 : 0))[0];
  if (!preferred || preferred.condition === "unknown") return { ...base, observation_ids: ids };
  return { ...base, state: "known", condition: preferred.condition, confidence_band: preferred.confidence_band,
    observation_ids: ids, expires_sim_minute: preferred.expires_sim_minute };
}
export function deriveKnowledgeSnapshot(pairs: readonly KnowledgePair[], context: EvidenceContext): SegmentKnowledge[] {
  const ids = pairs.map(item => JSON.stringify([item.segment_id, item.vehicle_type]));
  if (new Set(ids).size !== ids.length) fail("INVALID_SCHEMA");
  return pairs.map(pair => deriveCurrentKnowledge(pair, context));
}
