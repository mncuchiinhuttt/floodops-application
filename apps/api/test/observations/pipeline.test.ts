import { expect, test } from "bun:test";
import { createFunctionalScenario, createReportCases } from "@floodops/test-fixtures";
import { advanceRun, applyKnowledgeTransition, createRun, loadScenario, sealScenarioDraft } from "@floodops/simulation";
import type { SimulationPolicy, SimulationRun } from "@floodops/simulation";
import { submitReport } from "@floodops/domain/reporting";
import { proposeConflictResolution, proposeObservationAcceptance, reconcileEvidence } from "@floodops/domain/knowledge";
import { observation, participant } from "../sources/test-context.ts";

export const hash = (text: string) => new Bun.CryptoHasher("sha256").update(text).digest("hex");
export const highOnly: SimulationPolicy = { authorizeEntry: ({ knowledge }) => ({
  allowed: knowledge?.state === "known" && knowledge.confidence_band === "high", reason: "POL-02" }) };
export function runFixture(): SimulationRun {
  return advanceRun(createRun(loadScenario(sealScenarioDraft(createFunctionalScenario(), hash), hash), "run_sources001"), 3, highOnly).run;
}
export function pipelineContext(run: SimulationRun) {
  const config = run.scenario.manifest.config;
  return { ...run.sourceSnapshot, graph: run.scenario.manifest.graph, t0: config.t0, nowSimMinute: run.nowMs / 60_000,
    sourceFixtures: config.source_fixtures, profiles: config.source_policy_profiles, parameters: config.parameters, participant: participant(), boundVehicleTypes: ["motorbike" as const],
    dispatcherEntities: [], sourceId: "src_citizen1", reportId: "rpt_pipeline01", observationId: "obs_pipeline01", inputRevision: 3,
    receivedAt: "2026-10-31T00:03:00Z", epochs: run.knowledge, fixtureAssets: config.fixture_assets, media: null, reasonId: "manual-functional-review" };
}
test("canonical public source→report→proposal→Simulation pipeline preserves operations and frozen facts", () => {
  const run = runFixture(), before = structuredClone(run), context = pipelineContext(run);
  const pending = submitReport(createReportCases().fresh, context);
  expect(pending.status).toBe("pending_review");
  expect(run).toEqual(before);
  const proposal = proposeObservationAcceptance(pending, "normal", run.knowledge, context);
  const next = applyKnowledgeTransition(run, proposal.knowledge, { reasonId: context.reasonId,
    sourceSnapshot: { ...run.sourceSnapshot, observations: proposal.observations } });
  expect(proposal.report.award_id).toBeNull();
  expect(next.nowMs).toBe(run.nowMs);
  expect(next.branches).toEqual(run.branches);
  expect(next.scenario).toEqual(run.scenario);
  expect(next.sourceSnapshot.sources).toEqual(run.sourceSnapshot.sources);
  expect(next.sourceSnapshot.inputEvents).toEqual(run.sourceSnapshot.inputEvents);
  expect(next.sourceSnapshot.restrictions).toEqual(run.sourceSnapshot.restrictions);
  expect(next.sourceSnapshot.observations.slice(0, run.sourceSnapshot.observations.length)).toEqual(run.sourceSnapshot.observations);
  expect(next.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "car")?.state).toBe("ordinary_unknown");
  expect(next.knowledge.filter(item => ["seg_edge17", "seg_edge21"].includes(item.segment_id)).every(item => item.state === "authoritative_closed")).toBe(true);
  expect(run).toEqual(before);
});
test("conflict expiry reconciles observation flags before applying through the public Simulation port", () => {
  const initial = runFixture(), context = pipelineContext(initial);
  const high = observation({ observation_id: "obs_highlong1", source_id: "src_seedcam1", confidence_band: "high", condition: "normal",
    expires_at: "2026-10-31T00:21:00Z", expires_sim_minute: 21 });
  const report = submitReport(createReportCases().fresh, context);
  const proposal = proposeObservationAcceptance(report, "impassable", initial.knowledge, { ...context, observations: [...context.observations, high] });
  const conflictRun = applyKnowledgeTransition(initial, proposal.knowledge, { reasonId: "conflict-input", sourceSnapshot: { ...initial.sourceSnapshot, observations: proposal.observations } });
  expect(conflictRun.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")?.state).toBe("unresolved_conflict");
  const advanced = advanceRun(conflictRun, 6, highOnly).run;
  const reconciled = reconcileEvidence(advanced.knowledge, pipelineContext(advanced));
  const next = applyKnowledgeTransition(advanced, reconciled.knowledge, { reasonId: "expire-review", sourceSnapshot: { ...advanced.sourceSnapshot, observations: reconciled.observations } });
  expect(next.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")).toMatchObject({ state: "known", confidence_band: "high", expires_sim_minute: 21 });
  expect(next.sourceSnapshot.observations.find(item => item.observation_id === high.observation_id)?.has_conflict).toBe(false);
});

test("new multi-vehicle report splits evidence so bike conflict cannot poison car knowledge", () => {
  const run = runFixture(), original = pipelineContext(run);
  const context = { ...original, boundVehicleTypes: ["motorbike", "car"] as const, observationIds: [
    { vehicle_type: "motorbike" as const, observation_id: "obs_splitbike1" },
    { vehicle_type: "car" as const, observation_id: "obs_splitauto1" }] };
  const report = submitReport({ ...createReportCases().fresh, vehicle_types: ["motorbike", "car"] }, context);
  const proposal = proposeObservationAcceptance(report, "impassable", run.knowledge, context);
  const next = applyKnowledgeTransition(run, proposal.knowledge, { reasonId: "split-multivehicle", sourceSnapshot: { ...run.sourceSnapshot, observations: proposal.observations } });
  expect(next.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")?.state).toBe("unresolved_conflict");
  expect(next.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "car")).toMatchObject({ state: "known", condition: "impassable" });
  expect(proposal.observations.find(item => item.observation_id === "obs_splitauto1")?.has_conflict).toBe(false);
  expect(proposal.report.observation_ids).toHaveLength(2);
  expect(proposeObservationAcceptance(proposal.report, "impassable", run.knowledge, { ...context, observations: proposal.observations }).kind).toBe("redelivery");
});

test("integrated producer preserves per-vehicle conflict/closure/expiry without route or award effects", () => {
  const run = runFixture(), pairs = run.knowledge.map(pair => pair.segment_id === "seg_edge27" ? { ...pair, knowledge_epoch: 1 } : pair);
  const shared = observation({ observation_id: "obs_legacyshared1", source_id: "src_seedcam1", confidence_band: "high", vehicle_types: ["motorbike", "car"],
    expires_at: "2026-10-31T00:21:00Z", expires_sim_minute: 21 });
  const contrary = observation({ observation_id: "obs_legacybike1", condition: "impassable" });
  const closed = { ...shared, observation_id: "obs_sharedclosed1", segment_id: "seg_edge17" };
  const context = { ...pipelineContext(run), observations: [...run.sourceSnapshot.observations, shared, contrary, closed] };
  const reconciled = reconcileEvidence(pairs, context);
  expect(reconcileEvidence(pairs, { ...context, observations: [...context.observations].reverse() }).knowledge).toEqual(reconciled.knowledge);
  const next = applyKnowledgeTransition(run, reconciled.knowledge, { reasonId: "legacy-scoped-consumer", sourceSnapshot: { ...run.sourceSnapshot, observations: reconciled.observations } });
  expect(next.knowledge.find(pair => pair.segment_id === "seg_edge27" && pair.vehicle_type === "motorbike")?.state).toBe("unresolved_conflict");
  expect(next.knowledge.find(pair => pair.segment_id === "seg_edge27" && pair.vehicle_type === "car")).toMatchObject({ state: "known", confidence_band: "high" });
  expect(next.sourceSnapshot.observations.find(item => item.observation_id === shared.observation_id)?.has_conflict).toBe(true);
  expect(next.knowledge.filter(pair => pair.segment_id === "seg_edge17").every(pair => pair.state === "authoritative_closed")).toBe(true);
  expect(next.branches.floodops!.operations).toEqual(run.branches.floodops!.operations);
  expect(reconciled).not.toHaveProperty("awards");
  const pair = pairs.find(pair => pair.segment_id === "seg_edge27" && pair.vehicle_type === "motorbike")!;
  const resolved = proposeConflictResolution({ pair, pairs, keepObservationIds: ["obs_bike001", shared.observation_id],
    supersedeObservationIds: [contrary.observation_id], reasonId: "human-scoped-resolution" }, context);
  const afterResolution = applyKnowledgeTransition(run, resolved.knowledge, { reasonId: resolved.reasonId, sourceSnapshot: { ...run.sourceSnapshot, observations: resolved.observations } });
  expect(afterResolution.knowledge.filter(pair => pair.segment_id === "seg_edge27" && ["motorbike", "car"].includes(pair.vehicle_type)).every(pair => pair.state === "known")).toBe(true);
  const advanced = advanceRun(next, 6, highOnly).run, expired = reconcileEvidence(advanced.knowledge, { ...pipelineContext(advanced), observations: advanced.sourceSnapshot.observations });
  const afterExpiry = applyKnowledgeTransition(advanced, expired.knowledge, { reasonId: "legacy-scoped-expiry", sourceSnapshot: { ...advanced.sourceSnapshot, observations: expired.observations } });
  expect(afterExpiry.knowledge.filter(pair => pair.segment_id === "seg_edge27" && ["motorbike", "car"].includes(pair.vehicle_type)).every(pair => pair.state === "known" && pair.confidence_band === "high")).toBe(true);
  expect(afterExpiry.sourceSnapshot.observations.find(item => item.observation_id === shared.observation_id)?.has_conflict).toBe(false);
});
