import type { SegmentKnowledge } from "@floodops/contracts";
import type { EntryContext, SimulationRun } from "@floodops/simulation";
import type { PolicyDecision } from "./planning-types.ts";
import { decision } from "./planning-types.ts";

export function scopedKnowledge(context: Pick<EntryContext, "knowledge" | "driver" | "segmentId">): Readonly<SegmentKnowledge> | null {
  return context.knowledge?.segment_id === context.segmentId && context.knowledge.vehicle_type === context.driver.vehicle_type
    ? context.knowledge : null;
}
export function capturedEntryKnowledge(run: SimulationRun, context: EntryContext): Readonly<SegmentKnowledge> | null {
  const captured = run.knowledge.find(k => k.segment_id === context.segmentId && k.vehicle_type === context.driver.vehicle_type);
  const current = scopedKnowledge(context);
  // The simulator erases expired observations; an old grant must not revive them as unknown.
  const erased = captured && current?.state === "ordinary_unknown" && captured.knowledge_epoch === current.knowledge_epoch
    && (captured.state === "unresolved_conflict" || (captured.expires_sim_minute !== null && context.atMinute >= captured.expires_sim_minute));
  return erased ? captured : current;
}
/** Shared evidence guards carry no plan identity or approval authority. */
export function roadKnowledgeGuard(k: Readonly<SegmentKnowledge> | null, atMinute: number,
  ids: readonly string[], expectedEpoch?: number): PolicyDecision | null {
  if (!Number.isFinite(atMinute) || atMinute < 0) return decision("blocked", "POL-03", "INVALID_CLOCK", ids);
  if (k?.state === "authoritative_closed") return decision("blocked", "POL-01", "AUTHORITATIVE_CLOSED", ids);
  if (k?.state === "unresolved_conflict") return decision("blocked", "POL-03", "UNRESOLVED_CONFLICT", ids);
  if (k && expectedEpoch !== undefined && k.knowledge_epoch !== expectedEpoch) return decision("needs_replan", "POL-03", "STALE_EPOCH", ids);
  if (k && ((k.expires_sim_minute !== null && atMinute >= k.expires_sim_minute)
    || (k.state === "known" && k.expires_sim_minute === null))) return decision("needs_replan", "POL-03", "EVIDENCE_EXPIRED", ids);
  if (k?.condition === "impassable") return decision("blocked", "POL-01", "EFFECTIVE_IMPASSABLE", ids);
  return null;
}
