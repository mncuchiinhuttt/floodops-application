import type { DeterministicPlannerMetadata, EvaluationRun } from "@floodops/contracts";
import type { SimulationPersistence } from "@floodops/domain/public-ports";
import type { SimulationRun } from "@floodops/simulation";
import type { SearchLimits } from "../planning/index";

export const EVAL_START = "evaluation.start", EVAL_BEGIN = "evaluation.begin", EVAL_COMPLETE = "evaluation.complete";
export const EVAL_VIEW = "evaluation.state", EVALUATION_KEY = "evaluation_runs";
/** A queued/running record older than this is reported failed: the Worker that drives it is gone. */
export const EVALUATION_DEADLINE_MS = 120_000, TRIAL_DEADLINE_MS = 30_000;
export const EVALUATION_TRIALS = 10;

export interface EvaluationRecord { run: EvaluationRun; inputRevision: number; attemptId: string | null; createdMs: number }
export interface EvaluationState { version: 1; session_id: string; generation: number; runs: Record<string, EvaluationRecord> }
/** Deterministic replay reuses the committed planner configuration; no provider, model or key participates. */
export interface EvaluationOptions<State> {
  persistence: SimulationPersistence<SimulationRun, State>;
  planner: Readonly<DeterministicPlannerMetadata>;
  limits: SearchLimits;
}
