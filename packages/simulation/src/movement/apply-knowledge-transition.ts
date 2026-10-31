import { SegmentKnowledgeSchema } from "@floodops/contracts";
import type { SegmentKnowledge } from "@floodops/contracts";
import { freezeValue } from "@floodops/domain/operations";
import type { BranchId, SimulationRun } from "./run-types.ts";
import { appendLog } from "./run-log.ts";
import { canonicalJson } from "../scenario/fingerprint.ts";
import { validateSourceSnapshot } from "../scenario/validate-sources.ts";
import { hasAuthorizedReopening } from "../scenario/validate-knowledge.ts";
import { millisecondsToMinutes } from "../clock/index.ts";

/** Pure seam for a server-validated SourcesMedia/ReviewRewards transition, not a public command. */
export function applyKnowledgeTransition(input: SimulationRun, knowledge: readonly SegmentKnowledge[],
  context: { sourceSnapshot: SimulationRun["sourceSnapshot"]; reasonId: string }): SimulationRun {
  if (!context.reasonId.trim()) throw new Error("Knowledge transition needs an audit reason ID.");
  const run = structuredClone(input), minute = millisecondsToMinutes(run.nowMs);
  const next = knowledge.map(item => SegmentKnowledgeSchema.parse(item));
  const key = (item: SegmentKnowledge) => JSON.stringify([item.segment_id, item.vehicle_type]);
  if (new Set(next.map(key)).size !== next.length) throw new Error("Duplicate knowledge pairs.");
  if (canonicalJson(context.sourceSnapshot.sources) !== canonicalJson(run.sourceSnapshot.sources)) throw new Error("Source registry is frozen for this scenario.");
  for (const [previous, current, id] of [
    [run.sourceSnapshot.inputEvents, context.sourceSnapshot.inputEvents, "input_event_id"],
    [run.sourceSnapshot.restrictions, context.sourceSnapshot.restrictions, "restriction_id"]
  ] as const) for (const record of previous) {
    const incoming = current.find(item => (item as unknown as Record<string, unknown>)[id] === (record as unknown as Record<string, unknown>)[id]);
    if (!incoming || canonicalJson(incoming) !== canonicalJson(record)) throw new Error("Existing source inputs/restrictions are immutable.");
  }
  for (const record of run.sourceSnapshot.observations) {
    const incoming = context.sourceSnapshot.observations.find(item => item.observation_id === record.observation_id);
    const immutable = (item: typeof record) => { const { validation: _v, has_conflict: _c, ...rest } = item; void _v; void _c; return rest; };
    if (!incoming || canonicalJson(immutable(incoming)) !== canonicalJson(immutable(record))) throw new Error("Observation facts are immutable; use a new ID.");
  }
  const manifest = { ...run.scenario.manifest, initialKnowledge: next, events: [], sourceSnapshot: structuredClone(context.sourceSnapshot) };
  for (const item of next) if (!run.scenario.routing.edges.some(edge => edge.id === item.segment_id && edge.vehicles.includes(item.vehicle_type))) throw new Error("Unknown knowledge pair.");
  validateSourceSnapshot(manifest, minute);
  const changed: SegmentKnowledge[] = [];
  for (const previous of run.knowledge) {
    const current = next.find(item => key(item) === key(previous));
    if (!current || current.knowledge_epoch < previous.knowledge_epoch) throw new Error("Missing/stale knowledge transition.");
    if (previous.state === "authoritative_closed" && current.state !== "authoritative_closed"
      && !hasAuthorizedReopening(manifest, { id: context.reasonId, atMinute: minute, sequence: 0, afterIds: [], kind: "reopening",
        knowledge: current, supersedesRestrictionIds: previous.restriction_ids })) throw new Error("Closure requires authorized reopening.");
    if (canonicalJson(current) !== canonicalJson(previous)) changed.push(current);
  }
  changed.push(...next.filter(item => !run.knowledge.some(previous => key(previous) === key(item))));
  run.knowledge = next; run.sourceSnapshot = manifest.sourceSnapshot;
  if (changed.length) run.incidentSeen = true;
  for (const [id, branch] of Object.entries(run.branches)) for (const driver of branch.operations.drivers) {
    const relevant = changed.filter(item => item.vehicle_type === driver.vehicle_type);
    if (!relevant.length) continue;
    const runtime = branch.runtime[driver.driver_id]!;
    if (id === "reroute_only") runtime.needsReroute = true;
    if (driver.position.kind === "on_edge" && relevant.some(item => item.segment_id === driver.position.segment_id)) {
      appendLog(run, id as BranchId, "in_progress_at_change", { driverId: driver.driver_id, segmentId: driver.position.segment_id });
    }
    if (driver.status === "waiting" && (id === "reroute_only" || relevant.some(item => item.segment_id === runtime.segments[runtime.cursor]))) driver.status = "idle";
  }
  appendLog(run, null, "input", { reason: context.reasonId });
  return freezeValue(run);
}
