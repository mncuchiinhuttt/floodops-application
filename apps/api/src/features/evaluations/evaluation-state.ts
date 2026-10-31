import { parseSchema } from "@floodops/contracts";
import { fail } from "../../shared/index";
import type { Snapshot } from "../../shared/index";
import { EVALUATION_DEADLINE_MS, EVALUATION_KEY } from "./runtime-types";
import type { EvaluationState } from "./runtime-types";

/**
 * The key is written only by this feature's reducers, so the persisted shape is asserted once here;
 * every run payload is still re-parsed through the contract schema. A queued/running run past its
 * deadline is projected failed, never silently kept alive.
 */
export function readEvaluationState(snapshot: Snapshot, now: number): EvaluationState {
  const meta = snapshot.meta, raw = snapshot.values[EVALUATION_KEY];
  if (raw === undefined) return { version: 1, session_id: meta.session_id, generation: meta.generation, runs: {} };
  if (!raw || typeof raw !== "object") fail(503, "CONFIG_INCOMPLETE");
  const persisted = raw as EvaluationState;
  if (persisted.version !== 1 || persisted.session_id !== meta.session_id || persisted.generation !== meta.generation
    || !persisted.runs || typeof persisted.runs !== "object") fail(503, "CONFIG_INCOMPLETE");
  const state: EvaluationState = { version: 1, session_id: meta.session_id, generation: meta.generation, runs: {} };
  for (const [id, entry] of Object.entries(persisted.runs)) {
    const run = parseSchema("EvaluationRun", entry.run);
    if (run.evaluation_id !== id || !Number.isSafeInteger(entry.inputRevision) || !Number.isFinite(entry.createdMs)
      || !(entry.attemptId === null || typeof entry.attemptId === "string")) fail(503, "CONFIG_INCOMPLETE");
    const expired = ["queued", "running"].includes(run.status) && now - entry.createdMs > EVALUATION_DEADLINE_MS;
    state.runs[id] = { run: expired ? { ...run, status: "failed" } : run, inputRevision: entry.inputRevision,
      attemptId: entry.attemptId, createdMs: entry.createdMs };
  }
  return state;
}
export function evaluationValues(snapshot: Snapshot, state: EvaluationState): Record<string, unknown> {
  return { ...snapshot.values, [EVALUATION_KEY]: state };
}
