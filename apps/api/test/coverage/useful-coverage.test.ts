import { expect, test } from "bun:test";
import type { Observation, SegmentKnowledge, Source } from "@floodops/contracts";
import { CoverageSchema } from "@floodops/contracts";
import { deriveUsefulCoverage, proposeGapOpenings, createRewardLedger, RewardProposalError } from "@floodops/domain/rewards";
import { bike, car, context, coverage, known, lowObservation, openedLedger, freeze, source } from "../rewards/fixtures.ts";

function current(observation: Observation = lowObservation, knowledge: SegmentKnowledge = known(observation), sources: Source[] = [source]) {
  return coverage({ knowledge: [knowledge], observations: [observation], sources });
}
test("integrated functional low confidence covers only its vehicle; expiry is exclusive", () => {
  const input = freeze(current()), result = deriveUsefulCoverage(input);
  expect(result.coverage).toEqual({ covered_pairs: 1, relevant_pairs: 2, ratio: 0.5 });
  expect(CoverageSchema.parse(result.coverage)).toEqual(result.coverage);
  expect(result.pairs.find(pair => pair.scope.vehicle_type === "car")?.covered).toBeFalse();
  expect(deriveUsefulCoverage({ ...input, now_sim_minute: 5.999 }).coverage.covered_pairs).toBe(1);
  expect(deriveUsefulCoverage({ ...input, now_sim_minute: 6 }).coverage.covered_pairs).toBe(0);
});
test.each(["pending", "rejected", "superseded"] as const)("%s observation is not useful", validation => {
  expect(deriveUsefulCoverage(current({ ...lowObservation, validation })).coverage.covered_pairs).toBe(0);
});
test.each(["ordinary_unknown", "unresolved_conflict", "authoritative_closed"] as const)("%s knowledge cannot be overwritten by reward coverage", state => {
  const input = current(lowObservation, { ...known(lowObservation), state });
  const original = structuredClone(input); expect(deriveUsefulCoverage(input).coverage.covered_pairs).toBe(0); expect(input).toEqual(original);
});
test("conflict, epoch, vehicle, unknown, future and unlinked evidence stay uncovered", () => {
  const invalid: Observation[] = [
    { ...lowObservation, knowledge_epoch: 0 },
    { ...lowObservation, vehicle_types: ["truck"] }, { ...lowObservation, condition: "unknown" },
    { ...lowObservation, observed_sim_minute: 4 }, { ...lowObservation, expires_sim_minute: 3 },
    { ...lowObservation, segment_id: "seg_other001" },
  ];
  for (const observation of invalid) expect(deriveUsefulCoverage(current(observation)).coverage.covered_pairs).toBe(0);
  expect(deriveUsefulCoverage(current(lowObservation, { ...known(lowObservation), observation_ids: [] })).coverage.covered_pairs).toBe(0);
  expect(deriveUsefulCoverage(current(lowObservation, { ...known(lowObservation), knowledge_epoch: 0 })).coverage.covered_pairs).toBe(0);
  expect(deriveUsefulCoverage(current(lowObservation, { ...known(lowObservation), confidence_band: null })).coverage.covered_pairs).toBe(0);
  expect(deriveUsefulCoverage(current(lowObservation, { ...known(lowObservation), expires_sim_minute: null })).coverage.covered_pairs).toBe(0);
});
test("source must exist and be an available observation, not context/restriction", () => {
  for (const sources of [[], [{ ...source, access_status: "unavailable" as const }], [{ ...source, role: "context" as const }], [{ ...source, role: "restriction" as const }]]) {
    expect(deriveUsefulCoverage(current(lowObservation, known(lowObservation), sources)).coverage.covered_pairs).toBe(0);
  }
});
test("zero relevant scope uses null ratio; invalid time and ambiguous scopes fail", () => {
  expect(deriveUsefulCoverage(coverage({ scope: [] })).coverage).toEqual({ covered_pairs: 0, relevant_pairs: 0, ratio: null });
  for (const now_sim_minute of [-1, NaN, Infinity]) expect(() => deriveUsefulCoverage(coverage({ now_sim_minute }))).toThrow(RewardProposalError);
  expect(() => deriveUsefulCoverage(coverage({ scope: [bike, bike] }))).toThrow(RewardProposalError);
  expect(() => deriveUsefulCoverage(current(lowObservation, known(lowObservation), [source, source]))).toThrow(RewardProposalError);
  expect(() => deriveUsefulCoverage(coverage({ knowledge: [known(lowObservation), known(lowObservation)] }))).toThrow(RewardProposalError);
});
test("gap openings are deterministic, preserve prior ledger, replay and require fresh allocated IDs", () => {
  const empty = freeze(createRewardLedger(context.session_id, 1, 0)), input = freeze(coverage());
  const original = structuredClone(empty), ledger = openedLedger(input);
  expect(empty).toEqual(original); expect(ledger.gaps).toHaveLength(2); expect(ledger.gaps.every(item => item.status === "open")).toBeTrue();
  expect(proposeGapOpenings(ledger, input, { ...context, event_sequence: 1 }, [])).toEqual(ledger);
  expect(() => proposeGapOpenings(empty, input, { ...context, event_sequence: 1 }, [])).toThrow(RewardProposalError);
  expect(() => proposeGapOpenings(empty, input, { ...context, generation: 2 }, [{ ...bike, gap_id: "gap_bike001" }, { ...car, gap_id: "gap_car0001" }])).toThrow(RewardProposalError);
  expect(() => proposeGapOpenings(empty, input, { ...context, event_sequence: 0 }, [{ ...bike, gap_id: "gap_bike001" }, { ...car, gap_id: "gap_car0001" }])).toThrow(RewardProposalError);
});

test("an aggregate conflict flag without a matching current contradiction does not remove useful coverage", () => {
  expect(deriveUsefulCoverage(current({ ...lowObservation, has_conflict: true })).coverage.covered_pairs).toBe(1);
});
