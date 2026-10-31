import { expect, test } from "bun:test";
import { EvaluationRunSchema } from "@floodops/contracts";
import type { EvaluationTrial } from "@floodops/contracts";
import { aggregateEvaluation, nearestRankP95 } from "../../src/features/evaluations/pure/index.ts";

function trials(): EvaluationTrial[] {
  return Array.from({ length: 10 }, (_, index) => ({
    trial: index + 1, first_proposal_valid: true, latency_ms: (10 - index) * 100,
    failed: false, error_code: null, plan_id: `pln_example${index}`, planner_config_hash: "frozen-config-v1"
  }));
}
function aggregate(samples = trials()) {
  return aggregateEvaluation({ evaluationId: "evl_evaluation1", kind: "deterministic_replay",
    isRealModel: false, plannerConfigHash: "frozen-config-v1", trials: samples });
}

test("all ten first responses are retained, sorted and validated without mutating input", () => {
  const samples = trials().reverse(), before = JSON.stringify(samples);
  const result = aggregate(samples);
  expect(EvaluationRunSchema.parse(result)).toEqual(result);
  expect(result).toMatchObject({ status: "completed", is_real_model: false,
    valid_first_proposals: 10, p95_ms: 1000 });
  expect(result.trials.map(trial => trial.trial)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  expect(JSON.stringify(samples)).toBe(before);
});

test("timeout, refusal, invalid output and incomplete first proposals stay in denominator", () => {
  const samples = trials();
  for (const [index, error] of (["PLANNER_TIMEOUT", "NO_FEASIBLE_PLAN", "INVALID_SCHEMA", "CONFIG_INCOMPLETE"] as const).entries()) {
    samples[index] = { ...samples[index]!, first_proposal_valid: false, failed: true,
      plan_id: null, error_code: error, latency_ms: 9000 + index };
  }
  const result = aggregate(samples);
  expect(result.valid_first_proposals).toBe(6);
  expect(result.trials).toHaveLength(10);
  expect(result.trials.filter(trial => trial.failed)).toHaveLength(4);
  expect(result.p95_ms).toBe(9003);
});

test("a missing latency makes p95 unavailable even with nine fast successes", () => {
  const samples = trials();
  samples[9] = { ...samples[9]!, first_proposal_valid: false, failed: true,
    plan_id: null, error_code: "PLANNER_TIMEOUT", latency_ms: null };
  expect(aggregate(samples)).toMatchObject({ valid_first_proposals: 9, p95_ms: null });
  expect(aggregate(samples).trials[9]!.latency_ms).toBeNull();
});

test("invalid first response cannot disappear when aggregation has no execution error", () => {
  const samples = trials(); samples[0]!.first_proposal_valid = false;
  expect(aggregate(samples).valid_first_proposals).toBe(9);
});

test("exactly ten unique bounded IDs and one frozen planner config are mandatory", () => {
  expect(() => aggregate(trials().slice(1))).toThrow("Exactly ten");
  expect(() => aggregate([...trials(), trials()[0]!])).toThrow("Exactly ten");
  const duplicate = trials(); duplicate[9]!.trial = 1;
  expect(() => aggregate(duplicate)).toThrow("Duplicate or missing");
  for (const id of [0, 11, 1.5, NaN, Infinity]) {
    const samples = trials(); samples[9]!.trial = id;
    expect(() => aggregate(samples)).toThrow();
  }
  const changed = trials(); changed[9]!.planner_config_hash = "another-config";
  expect(() => aggregate(changed)).toThrow("configuration changed");
  expect(() => aggregateEvaluation({ evaluationId: "evl_evaluation1", kind: "deterministic_replay",
    isRealModel: false, plannerConfigHash: "", trials: trials() })).toThrow("frozen planner");
});

test("rejects contradictory success/failure/plan/error records", () => {
  for (const change of [
    { failed: true, error_code: "PLANNER_TIMEOUT" as const, plan_id: null },
    { error_code: "INVALID_SCHEMA" as const }, { plan_id: null }
  ]) {
    const samples = trials(); Object.assign(samples[0]!, change);
    expect(() => aggregate(samples)).toThrow();
  }
});

test("nearest rank uses actual finite measurements, accepts measured zero and never filters failures", () => {
  expect(nearestRankP95([0, 1, 2, 3, 4, 5, 6, 7, 8, 999])).toBe(999);
  expect(nearestRankP95(Array(20).fill(0).map((_, index) => index + 1))).toBe(19);
  expect(nearestRankP95([null, 2])).toBeNull();
  for (const invalid of [-1, NaN, Infinity, -Infinity]) {
    expect(() => nearestRankP95([null, invalid])).toThrow("finite nonnegative");
    const samples = trials(); samples[0]!.latency_ms = invalid;
    expect(() => aggregate(samples)).toThrow();
  }
  expect(() => nearestRankP95([])).toThrow();
});


test("failed samples retain canonical nullable errors and blocked plan IDs for audit", () => {
  const samples = trials();
  samples[0] = { ...samples[0]!, first_proposal_valid: false, failed: true, error_code: "POLICY_BLOCKED" };
  samples[1] = { ...samples[1]!, first_proposal_valid: false, failed: true, error_code: null, plan_id: null, latency_ms: null };
  const result = aggregate(samples);
  expect(result.valid_first_proposals).toBe(8);
  expect(result.trials[0]).toEqual(samples[0]);
  expect(result.trials[1]).toEqual(samples[1]);
  expect(result.p95_ms).toBeNull();
});

test("sparse measurements and sample arrays are rejected instead of invented", () => {
  expect(() => nearestRankP95(Array<number | null>(10))).toThrow("finite nonnegative");
  expect(() => aggregate(Array<EvaluationTrial>(10))).toThrow();
});


test("execution errors cannot masquerade as nonfailed trials, even when first proposal was invalid", () => {
  for (const error_code of ["PLANNER_TIMEOUT", "NO_FEASIBLE_PLAN", "INVALID_SCHEMA", "CONFIG_INCOMPLETE", "POLICY_BLOCKED"] as const) {
    const samples = trials();
    samples[0] = { ...samples[0]!, first_proposal_valid: false, failed: false, error_code };
    expect(() => aggregate(samples)).toThrow("execution error");
  }
});


test("M1 rejects legacy model configuration fields, old evaluation kind and real-model claims", () => {
  const input = { evaluationId: "evl_evaluation1", kind: "deterministic_replay" as const, isRealModel: false as const,
    plannerConfigHash: "frozen-config-v1", trials: trials() };
  expect(() => aggregateEvaluation({ ...input, kind: "model_quality" } as unknown as Parameters<typeof aggregateEvaluation>[0])).toThrow();
  expect(() => aggregateEvaluation({ ...input, isRealModel: true } as unknown as Parameters<typeof aggregateEvaluation>[0])).toThrow();
  const old = trials().map(({ planner_config_hash, ...trial }) => ({ ...trial, model_config_hash: planner_config_hash }));
  expect(() => aggregateEvaluation({ ...input, trials: old } as unknown as Parameters<typeof aggregateEvaluation>[0])).toThrow();
});
