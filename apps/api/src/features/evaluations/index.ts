import { createEvaluationRouter } from "./router";
import { evaluationRegistry } from "./evaluation-commands";
import type { EvaluationOptions } from "./runtime-types";

/** M1 deterministic replay/latency rehearsal runtime; the pure aggregator lives in ./pure. */
export function createEvaluationRuntime<State>(options: EvaluationOptions<State>) {
  return { registry: evaluationRegistry(options), router: createEvaluationRouter() };
}
export { aggregateEvaluation, nearestRankP95 } from "./pure/index";
export type { EvaluationOptions } from "./runtime-types";
