import { createFunctionalScenario, createReportCases } from "@floodops/test-fixtures";
import type { Observation, Source, SourcePolicyProfile, Participant } from "@floodops/contracts";
import type { EvidenceContext } from "../../../../packages/domain/src/sources/index.ts";
import type { ReportContext } from "../../../../packages/domain/src/reporting/index.ts";

export const pair = { segment_id: "seg_edge27", vehicle_type: "motorbike" as const, knowledge_epoch: 1 };
export function evidenceContext(): EvidenceContext {
  const fixture = createFunctionalScenario();
  return { graph: fixture.graph, t0: fixture.config.t0, nowSimMinute: 3, parameters: fixture.config.parameters,
    profiles: fixture.config.source_policy_profiles, sources: fixture.sourceSnapshot.sources,
    observations: fixture.sourceSnapshot.observations, restrictions: fixture.sourceSnapshot.restrictions,
    inputEvents: fixture.sourceSnapshot.inputEvents, sourceFixtures: fixture.config.source_fixtures };
}
export function participant(role: Participant["role"] = "contributor"): Participant {
  return { participant_id: "ptr_actor001", role, bound_entity_id: role === "dispatcher" ? null : "ent_reporter1",
    expires_at: "2026-11-01T00:00:00Z", permissions: ["reports:submit", ...(role === "dispatcher" ? ["simulation:submit_as" as const] : [])], is_owner: false };
}
export function reportContext(): ReportContext {
  const fixture = createFunctionalScenario();
  return { ...evidenceContext(), participant: participant(), boundVehicleTypes: ["motorbike"], dispatcherEntities: [],
    sourceId: "src_citizen1", reportId: "rpt_citizen01", inputRevision: 1, receivedAt: "2026-10-31T00:03:00Z",
    epochs: fixture.initialKnowledge.map(item => item.segment_id === "seg_edge27" ? { ...item, knowledge_epoch: 1 } : item),
    fixtureAssets: fixture.config.fixture_assets, media: null };
}
export function driverContext(): ReportContext {
  const context = reportContext(), citizen = context.sources.find(item => item.source_id === "src_citizen1")!;
  const source: Source = { ...citizen, source_id: "src_driver01", source_type: "driver", policy_profile_id: "prf_citizen1" };
  return { ...context, sources: [...context.sources, source], sourceId: source.source_id, participant: participant("driver") };
}
export function observation(patch: Partial<Observation> = {}): Observation {
  return { ...structuredClone(evidenceContext().observations.find(item => item.observation_id === "obs_bike001")!), ...patch };
}
export const reports = createReportCases;
export function withProfile(context: EvidenceContext, patch: Partial<SourcePolicyProfile>): EvidenceContext {
  return { ...context, profiles: context.profiles.map(item => item.policy_profile_id === "prf_citizen1" ? { ...item, ...patch } : item) };
}
