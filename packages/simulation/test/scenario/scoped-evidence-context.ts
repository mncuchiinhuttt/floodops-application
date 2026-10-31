import type { Observation, VehicleType } from "@floodops/contracts";
import { deriveKnowledgeSnapshot } from "@floodops/domain/knowledge";
import type { EvidenceContext } from "@floodops/domain/sources";
import type { ScenarioManifest } from "@floodops/simulation";
import { fixture } from "./test-context.ts";

export const vehicles: VehicleType[] = ["motorbike", "car", "truck"];
export const scopes = Array.from({ length: 7 }, (_, mask) => vehicles.filter((_, bit) => ((mask + 1) & (1 << bit)) !== 0));
export const sharedId = "obs_shared001", contraryId = "obs_contrary001";
export function evidenceContext(manifest: ScenarioManifest, atMinute: number): EvidenceContext {
  return { graph: manifest.graph, t0: manifest.config.t0, nowSimMinute: atMinute, sources: manifest.sourceSnapshot.sources,
    profiles: manifest.config.source_policy_profiles, parameters: manifest.config.parameters,
    observations: manifest.sourceSnapshot.observations, restrictions: manifest.sourceSnapshot.restrictions,
    inputEvents: manifest.sourceSnapshot.inputEvents, sourceFixtures: manifest.config.source_fixtures };
}
export function derive(manifest: ScenarioManifest, atMinute: number) {
  return deriveKnowledgeSnapshot(manifest.initialKnowledge.map(({ segment_id, vehicle_type, knowledge_epoch }) =>
    ({ segment_id, vehicle_type, knowledge_epoch })), evidenceContext(manifest, atMinute));
}
export function scopedManifest(shared: readonly VehicleType[], contrary: readonly VehicleType[], reversed = false, segmentId = "seg_edge27") {
  const manifest = fixture();
  const template = structuredClone(manifest.sourceSnapshot.observations.find(item => item.source_id === "src_seedcam1")!);
  const normal: Observation = { ...template, observation_id: sharedId, segment_id: segmentId, knowledge_epoch: 0,
    vehicle_types: reversed ? [...shared].reverse() : [...shared], has_conflict: contrary.length > 0 };
  manifest.sourceSnapshot.observations = manifest.sourceSnapshot.observations.filter(item => item.segment_id !== segmentId
    || !item.vehicle_types.some(vehicle => shared.includes(vehicle)));
  manifest.sourceSnapshot.observations.push(normal);
  if (contrary.length) manifest.sourceSnapshot.observations.push({ ...structuredClone(normal), observation_id: contraryId,
    source_id: "src_citizen1", condition: "impassable", confidence_band: "low",
    expires_at: "2026-10-31T00:03:00Z", expires_sim_minute: 3,
    vehicle_types: reversed ? [...contrary].reverse() : [...contrary], has_conflict: true });
  manifest.events = manifest.events.filter(event => event.knowledge?.segment_id !== segmentId);
  manifest.initialKnowledge = derive(manifest, 0);
  return manifest;
}
export function contradictory(manifest: ScenarioManifest): Observation {
  return manifest.sourceSnapshot.observations.find(item => item.observation_id === contraryId)!;
}
