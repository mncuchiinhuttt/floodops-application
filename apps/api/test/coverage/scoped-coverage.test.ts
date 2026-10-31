import { expect, test } from "bun:test";
import { deriveUsefulCoverage, createRewardLedger, proposeGapOpenings, proposeReportReward } from "@floodops/domain/rewards";
import type { CoverageInput } from "@floodops/domain/rewards";
import { applyKnowledgeTransition, createRun, loadScenario, sealScenarioDraft } from "@floodops/simulation";
import { deriveKnowledgeSnapshot } from "@floodops/domain/knowledge";
import { context, hashA, report, unknownKnowledge } from "../rewards/fixtures.ts";
import { advanceScopedRun, contraryId, coverageInput, evidenceContext, hash, reportId, resolveScopedRun, scopedFixture, scopedRun, sharedId } from "./scoped-evidence-fixture.ts";

function beforeInput(after: CoverageInput): CoverageInput {
  return { ...after, knowledge: after.scope.map(unknownKnowledge), observations: [] };
}
function ledgerFor(input: CoverageInput) {
  return proposeGapOpenings(createRewardLedger(context.session_id, context.generation, 0), input,
    { ...context, event_sequence: 1 }, input.scope.map(scope => ({ ...scope, gap_id: `gap_${scope.vehicle_type}001` })));
}
function rewardFor(after: CoverageInput, vehicles: ("motorbike" | "car")[]) {
  return { before: beforeInput(after), after,
    report: report({ report_id: reportId, captured_at: "2026-10-31T00:00:00Z", received_at: "2026-10-31T00:00:00Z", captured_sim_minute: 0,
      vehicle_types: vehicles, observation_ids: [sharedId] }),
    photo: { report_id: reportId, normalized_hash: hashA, ready: true },
    config: { points_per_report: 7, eligible_source_ids: ["src_citizen1"] },
    context: { ...context, awarded_at: "2026-10-31T00:00:00Z" } };
}
for (const reversed of [false, true]) test(`public source/simulator consumer keeps car coverage for bike-only contradiction; reversed=${reversed}`, () => {
  const run = scopedRun(reversed), input = coverageInput(run), original = structuredClone(input);
  expect(run.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")?.state).toBe("unresolved_conflict");
  expect(run.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "car")?.state).toBe("known");
  expect(run.sourceSnapshot.observations.find(item => item.observation_id === sharedId)?.has_conflict).toBeTrue();
  const result = deriveUsefulCoverage(input);
  expect(result.coverage).toEqual({ covered_pairs: 1, relevant_pairs: 2, ratio: 0.5 });
  expect(result.pairs.find(pair => pair.scope.vehicle_type === "car")?.observation_ids).toEqual([sharedId]);
  expect(result.pairs.find(pair => pair.scope.vehicle_type === "motorbike")?.observation_ids).toEqual([]);
  expect(input).toEqual(original);
});
test("shared aggregate flag alone is not conflict, but all current contrary facts must be checked even if omitted from the projection", () => {
  const run = scopedRun(), input = coverageInput(run), projection = input.knowledge.map(item => item.segment_id === "seg_edge27"
    && item.vehicle_type === "motorbike" ? { ...item, state: "known" as const, condition: "normal" as const,
      confidence_band: "low" as const, observation_ids: [sharedId], expires_sim_minute: 3 } : item);
  const snapshot = { ...run.sourceSnapshot, observations: run.sourceSnapshot.observations.map(item => ({ ...item, has_conflict: false })) };
  expect(() => applyKnowledgeTransition(run, projection, { sourceSnapshot: snapshot, reasonId: "forged-known" })).toThrow();
  const result = deriveUsefulCoverage({ ...input, knowledge: projection, observations: snapshot.observations });
  expect(result.pairs.find(pair => pair.scope.vehicle_type === "motorbike")?.covered).toBeFalse();
  expect(result.pairs.find(pair => pair.scope.vehicle_type === "car")?.covered).toBeTrue();
});
test("expiry and public review resolution restore scoped coverage without requiring aggregate flag changes", () => {
  const run = scopedRun(), initial = deriveUsefulCoverage(coverageInput(run));
  const afterContraryExpiry = advanceScopedRun(run, 1);
  expect(afterContraryExpiry.sourceSnapshot.observations.find(item => item.observation_id === sharedId)?.has_conflict).toBeTrue();
  expect(deriveUsefulCoverage(coverageInput(afterContraryExpiry)).coverage.covered_pairs).toBe(2);
  expect(deriveUsefulCoverage(coverageInput(advanceScopedRun(afterContraryExpiry, 3))).coverage.covered_pairs).toBe(0);
  const resolved = resolveScopedRun(run);
  expect(resolved.sourceSnapshot.observations.find(item => item.observation_id === contraryId)?.validation).toBe("superseded");
  expect(deriveUsefulCoverage(coverageInput(resolved)).coverage.covered_pairs).toBe(2);
  expect(initial.coverage.covered_pairs).toBe(1);
});
test("report-wide conflict eligibility blocks mixed scope but does not poison a car-only report", () => {
  const input = coverageInput(scopedRun()), before = beforeInput(input), ledger = ledgerFor(before);
  const mixed = proposeReportReward(ledger, rewardFor(input, ["motorbike", "car"]));
  expect(mixed.reason).toBe("CONFLICT"); expect(mixed.new_award).toBeNull(); expect(mixed.filled_gap_ids).toEqual([]);
  expect(mixed.ledger.gaps.every(gap => gap.status === "open")).toBeTrue();
  const car = proposeReportReward(ledger, rewardFor(input, ["car"]));
  expect(car.new_award?.points).toBe(7); expect(car.filled_gap_ids).toEqual(["gap_car001"]);
  expect(car.ledger.gaps.find(gap => gap.vehicle_type === "motorbike")?.status).toBe("open");
});
test("false aggregate flags cannot award a real matching unresolved report scope", () => {
  const input = coverageInput(scopedRun());
  const observations = input.observations.map(item => ({ ...item, has_conflict: false }));
  const knowledge = input.knowledge.map(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike"
    ? { ...item, state: "known" as const, condition: "normal" as const, confidence_band: "low" as const,
      observation_ids: [sharedId], expires_sim_minute: 3 } : item);
  const after = { ...input, observations, knowledge }, result = proposeReportReward(ledgerFor(beforeInput(after)), rewardFor(after, ["motorbike", "car"]));
  expect(result.reason).toBe("CONFLICT"); expect(result.new_award).toBeNull(); expect(result.filled_gap_ids).toEqual([]);
});
test("an actual authoritative closure cannot become covered through shared accepted evidence", () => {
  const manifest = scopedFixture();
  manifest.sourceSnapshot.restrictions.push({ restriction_id: "rst_scoped001", segment_id: "seg_edge27", vehicle_types: ["car"],
    kind: "closure", authority_profile_id: "prf_authority1", effective_sim_minute: 0, supersedes_restriction_id: null, evidence_ids: ["evd_closure1"] });
  manifest.config.source_fixtures.push({ fixture_event_id: "fxe_scoped001", source_id: "src_authority1", title: "Synthetic closure", role: "restriction", scheduled_sim_minute: 0 });
  manifest.sourceSnapshot.inputEvents.push({ input_event_id: "evt_scoped001", source_id: "src_authority1", fixture_event_id: "fxe_scoped001", role: "restriction",
    observed_at: manifest.config.t0, received_at: manifest.config.t0, sim_minute: 0, label: "simulated", measurement: null, restriction_id: "rst_scoped001", report_id: null });
  manifest.initialKnowledge = deriveKnowledgeSnapshot(manifest.initialKnowledge, evidenceContext(manifest, 0));
  const run = createRun(loadScenario(sealScenarioDraft(manifest, hash), hash), "run_closure001");
  expect(run.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "car")?.state).toBe("authoritative_closed");
  expect(deriveUsefulCoverage(coverageInput(run)).coverage.covered_pairs).toBe(0);
});

test("omitting an entire conflicted knowledge row cannot reward the remaining clean vehicle", () => {
  const input = coverageInput(scopedRun()), after = { ...input, knowledge: input.knowledge.filter(item =>
    item.segment_id !== "seg_edge27" || item.vehicle_type !== "motorbike") };
  const ledger = ledgerFor(beforeInput(after)), mixed = proposeReportReward(ledger, rewardFor(after, ["motorbike", "car"]));
  expect(mixed.reason).toBe("CONFLICT"); expect(mixed.new_award).toBeNull(); expect(mixed.filled_gap_ids).toEqual([]);
  expect(mixed.ledger.gaps.every(gap => gap.status === "open")).toBeTrue();
  const carOnly = proposeReportReward(ledger, rewardFor(after, ["car"]));
  expect(carOnly.new_award?.points).toBe(7); expect(carOnly.filled_gap_ids).toEqual(["gap_car001"]);
});
