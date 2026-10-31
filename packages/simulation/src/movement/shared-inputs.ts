import type { BranchId, SimulationRun } from "./run-types.ts";
import { hasAuthorizedReopening } from "../scenario/validate-knowledge.ts";
import { appendLog } from "./run-log.ts";
import { minutesToMilliseconds, millisecondsToMinutes } from "../clock/index.ts";

export function applySharedInputs(run: SimulationRun): void {
  const events = [...run.scenario.manifest.events].sort((a, b) => a.atMinute - b.atMinute || a.sequence - b.sequence);
  while (run.inputCursor < events.length && minutesToMilliseconds(events[run.inputCursor]!.atMinute) <= run.nowMs) {
    const event = events[run.inputCursor++]!;
    if (event.knowledge) {
      const next = structuredClone(event.knowledge);
      const index = run.knowledge.findIndex(item => item.segment_id === next.segment_id && item.vehicle_type === next.vehicle_type);
      const previous = run.knowledge[index];
      if (previous && next.knowledge_epoch < previous.knowledge_epoch) throw new Error("Stale scenario knowledge epoch.");
      if (event.kind === "reopening") {
        if (!hasAuthorizedReopening(run.scenario.manifest, event) || previous?.state !== "authoritative_closed" || !previous.restriction_ids.length
          || previous.restriction_ids.some(id => !event.supersedesRestrictionIds.includes(id))) throw new Error("Reopening must supersede the current authoritative restriction.");
      } else if (previous?.state === "authoritative_closed" && next.state !== "authoritative_closed") {
        next.state = previous.state; next.condition = previous.condition; next.restriction_ids = [...previous.restriction_ids];
      }
      if (index < 0) run.knowledge.push(next); else run.knowledge[index] = next;
      run.incidentSeen = true;
      for (const [id, branch] of Object.entries(run.branches)) for (const driver of branch.operations.drivers) {
        const runtime = branch.runtime[driver.driver_id]!;
        if (driver.vehicle_type !== next.vehicle_type) continue;
        if (id === "reroute_only") runtime.needsReroute = true;
        if (driver.position.kind === "on_edge" && driver.position.segment_id === next.segment_id) {
          appendLog(run, id as BranchId, "in_progress_at_change", { driverId: driver.driver_id, segmentId: next.segment_id });
        }
        if (driver.status === "waiting" && (runtime.segments[runtime.cursor] === next.segment_id || id === "reroute_only")) driver.status = "idle";
      }
    }
    appendLog(run, null, "input", { segmentId: event.knowledge?.segment_id ?? null, reason: event.id });
  }
  const minute = millisecondsToMinutes(run.nowMs);
  for (const knowledge of run.knowledge) if (knowledge.expires_sim_minute !== null && minute >= knowledge.expires_sim_minute
    && knowledge.state !== "authoritative_closed" && knowledge.state !== "ordinary_unknown") {
    knowledge.state = "ordinary_unknown"; knowledge.condition = "unknown"; knowledge.confidence_band = null;
    // Expired observations are no longer current. A new ordinary-unknown approval
    // is a policy-owner decision; old evidence-bound approvals must fail there.
    knowledge.observation_ids = []; knowledge.expires_sim_minute = null;
    const reroute = run.branches.reroute_only;
    if (reroute) for (const driver of reroute.operations.drivers) if (driver.vehicle_type === knowledge.vehicle_type) {
      reroute.runtime[driver.driver_id]!.needsReroute = true;
    }
    appendLog(run, null, "expiry", { segmentId: knowledge.segment_id, reason: knowledge.vehicle_type });
  }
}
