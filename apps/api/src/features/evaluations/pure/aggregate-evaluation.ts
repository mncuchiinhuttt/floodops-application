import { EvaluationRunSchema, EvaluationTrialSchema } from "@floodops/contracts";
import type { EvaluationRun, EvaluationTrial } from "@floodops/contracts";

export interface EvaluationAggregationInput {
  evaluationId: string;
  kind: EvaluationRun["kind"];
  isRealModel: false;
  plannerConfigHash: string;
  trials: readonly EvaluationTrial[];
}

/** Missing measurements make p95 unavailable; measured failures remain in the sample. */
export function nearestRankP95(latencies: readonly (number | null)[]): number | null {
  const samples = [...latencies];
  if (samples.length === 0) throw new Error("Latency samples are required.");
  if (samples.some(value => value !== null && (!Number.isFinite(value) || value < 0))) {
    throw new Error("Latency must be a finite nonnegative measurement or null.");
  }
  if (samples.includes(null)) return null;
  const sorted = (samples as number[]).sort((a, b) => a - b);
  return sorted[Math.ceil(0.95 * sorted.length) - 1]!;
}

/** Completes aggregation, not product acceptance or proof that a real model ran. */
export function aggregateEvaluation(input: EvaluationAggregationInput): EvaluationRun {
  if (input.trials.length !== 10) throw new Error("Exactly ten independent first-proposal trials are required.");
  if (!input.plannerConfigHash.trim()) throw new Error("A frozen planner configuration hash is required.");
  const trials = [...input.trials].map(trial => EvaluationTrialSchema.parse(trial)).sort((a, b) => a.trial - b.trial);
  if (new Set(trials.map(trial => trial.trial)).size !== 10) throw new Error("Duplicate or missing evaluation trial.");
  for (const trial of trials) {
    if (trial.planner_config_hash !== input.plannerConfigHash) throw new Error("Evaluation planner configuration changed.");
    if (!trial.failed && trial.error_code !== null) throw new Error("An execution error requires a failed trial.");
    if (trial.first_proposal_valid && (trial.failed || trial.error_code !== null || trial.plan_id === null)) {
      throw new Error("A valid first proposal requires a successful plan without an error.");
    }
  }
  return EvaluationRunSchema.parse({
    evaluation_id: input.evaluationId, kind: input.kind, status: "completed", trials,
    valid_first_proposals: trials.filter(trial => trial.first_proposal_valid && !trial.failed).length,
    p95_ms: nearestRankP95(trials.map(trial => trial.latency_ms)), is_real_model: input.isRealModel
  });
}
