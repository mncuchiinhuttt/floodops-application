import type { BranchId, RunLog, SimulationRun } from "./run-types.ts";
import { millisecondsToMinutes } from "../clock/index.ts";

export function appendLog(run: SimulationRun, branch: BranchId | null, kind: RunLog["kind"],
  fields: Partial<Omit<RunLog, "sequence" | "atMinute" | "branch" | "kind">> = {}): void {
  if (!Number.isSafeInteger(run.nextSequence + 1)) throw new Error("Event sequence overflow.");
  run.log.push({ sequence: run.nextSequence++, atMinute: millisecondsToMinutes(run.nowMs), branch, kind,
    driverId: null, orderId: null, segmentId: null, reason: null, attemptId: null, scope: null,
    afterIncident: run.incidentSeen, category: null, ...fields });
}
