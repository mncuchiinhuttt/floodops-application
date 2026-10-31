import { aggregateEvaluation } from "../../src/features/evaluations/pure/index.ts";
import { projectComparableResults } from "../../src/features/results/pure/index.ts";
import { fixtureRun, snapshots } from "./result-fixtures.ts";

const run = fixtureRun();
const results = projectComparableResults({ sessionId: "ses_results001", branches: snapshots(run, true) });
const evaluation = aggregateEvaluation({ evaluationId: "evl_evaluation1", kind: "model_quality",
  isRealModel: false, modelConfigHash: "deterministic-smoke-only", trials: Array.from({ length: 10 }, (_, index) => ({
    trial: index + 1, first_proposal_valid: index !== 9, failed: index === 9,
    error_code: index === 9 ? "MODEL_TIMEOUT" : null, latency_ms: index === 9 ? null : index + 1,
    plan_id: index === 9 ? null : `pln_smoketest${index}`, model_config_hash: "deterministic-smoke-only"
  })) });
console.log(JSON.stringify({ proof: "pure math and actual functional simulator; no API/model/runtime acceptance",
  bundle_hash: run.scenario.bundleHash, seed_hash: run.scenario.manifest.config.seed_hash,
  graph_hash: run.scenario.manifest.config.graph_hash, results, evaluation }, null, 2));
