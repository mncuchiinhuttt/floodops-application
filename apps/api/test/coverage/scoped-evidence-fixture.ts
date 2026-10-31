import type { Observation } from "@floodops/contracts";
import { deriveKnowledgeSnapshot, proposeConflictResolution } from "@floodops/domain/knowledge";
import type { EvidenceContext } from "@floodops/domain/sources";
import type { CoverageInput } from "@floodops/domain/rewards";
import { advanceRun, applyKnowledgeTransition, createRun, loadScenario, sealScenarioDraft } from "@floodops/simulation";
import type { ScenarioManifest, SimulationRun } from "@floodops/simulation";
import { createFunctionalScenario } from "@floodops/test-fixtures";

export const sharedId = "obs_shared001", contraryId = "obs_contrary001", reportId = "rpt_scope001";
export const hash = (value: string) => new Bun.CryptoHasher("sha256").update(value).digest("hex");
export function evidenceContext(manifest: ScenarioManifest, nowSimMinute: number): EvidenceContext {
  return { graph: manifest.graph, t0: manifest.config.t0, nowSimMinute, sources: manifest.sourceSnapshot.sources,
    profiles: manifest.config.source_policy_profiles, parameters: manifest.config.parameters,
    observations: manifest.sourceSnapshot.observations, restrictions: manifest.sourceSnapshot.restrictions,
    inputEvents: manifest.sourceSnapshot.inputEvents, sourceFixtures: manifest.config.source_fixtures };
}
export function scopedFixture(reversed = false): ScenarioManifest {
  const manifest = createFunctionalScenario();
  const template = manifest.sourceSnapshot.observations.find(item => item.observation_id === "obs_bike001")!;
  const shared: Observation = { ...template, observation_id: sharedId, knowledge_epoch: 0, vehicle_types: ["motorbike", "car"],
    observed_at: manifest.config.t0, observed_sim_minute: 0, expires_at: "2026-10-31T00:03:00Z", expires_sim_minute: 3,
    evidence_ids: [reportId], has_conflict: true };
  const contrary: Observation = { ...shared, observation_id: contraryId, vehicle_types: ["motorbike"],
    condition: "impassable", expires_at: "2026-10-31T00:01:00Z", expires_sim_minute: 1, evidence_ids: ["rpt_contrary1"] };
  manifest.sourceSnapshot.observations = manifest.sourceSnapshot.observations.filter(item => item.segment_id !== "seg_edge27");
  manifest.sourceSnapshot.observations.push(shared, contrary);
  manifest.events = manifest.events.filter(event => event.knowledge?.segment_id !== "seg_edge27");
  if (reversed) {
    manifest.sourceSnapshot.observations.reverse(); shared.vehicle_types.reverse(); manifest.initialKnowledge.reverse();
  }
  manifest.initialKnowledge = deriveKnowledgeSnapshot(manifest.initialKnowledge.map(item => ({ segment_id: item.segment_id,
    vehicle_type: item.vehicle_type, knowledge_epoch: item.knowledge_epoch })), evidenceContext(manifest, 0));
  return manifest;
}
export function scopedRun(reversed = false): SimulationRun {
  return createRun(loadScenario(sealScenarioDraft(scopedFixture(reversed), hash), hash), "run_scoped001");
}
export function coverageInput(run: SimulationRun): CoverageInput {
  return { scope: run.knowledge.filter(item => item.segment_id === "seg_edge27" && item.vehicle_type !== "truck")
    .map(({ segment_id, vehicle_type, knowledge_epoch }) => ({ segment_id, vehicle_type, knowledge_epoch })),
  knowledge: run.knowledge, observations: run.sourceSnapshot.observations, sources: run.sourceSnapshot.sources, now_sim_minute: run.nowMs / 60_000 };
}
export function advanceScopedRun(run: SimulationRun, minute: number): SimulationRun {
  const advanced = advanceRun(run, minute, { authorizeEntry: () => ({ allowed: false, reason: "TEST_NO_AUTHORITY" }) });
  if (!advanced.complete) throw new Error("Fixture advance did not complete");
  const manifest = { ...advanced.run.scenario.manifest, sourceSnapshot: advanced.run.sourceSnapshot };
  const knowledge = deriveKnowledgeSnapshot(advanced.run.knowledge.map(({ segment_id, vehicle_type, knowledge_epoch }) =>
    ({ segment_id, vehicle_type, knowledge_epoch })), evidenceContext(manifest, minute));
  return applyKnowledgeTransition(advanced.run, knowledge, { sourceSnapshot: advanced.run.sourceSnapshot, reasonId: "scoped-expiry" });
}
export function resolveScopedRun(run: SimulationRun): SimulationRun {
  const manifest = { ...run.scenario.manifest, sourceSnapshot: run.sourceSnapshot };
  const pairs = run.knowledge.map(({ segment_id, vehicle_type, knowledge_epoch }) => ({ segment_id, vehicle_type, knowledge_epoch }));
  const resolution = proposeConflictResolution({ pair: { segment_id: "seg_edge27", vehicle_type: "motorbike", knowledge_epoch: 0 }, pairs,
    keepObservationIds: [sharedId], supersedeObservationIds: [contraryId], reasonId: "manual-resolution" }, evidenceContext(manifest, run.nowMs / 60_000));
  return applyKnowledgeTransition(run, resolution.knowledge, {
    sourceSnapshot: { ...run.sourceSnapshot, observations: resolution.observations }, reasonId: resolution.reasonId });
}
