import type { Observation, Report, SegmentKnowledge, Source } from "@floodops/contracts";
import { createFunctionalScenario } from "@floodops/test-fixtures";
import {
  createRewardLedger, proposeGapOpenings,
  type CoverageInput, type CoverageScope, type RewardInput,
} from "@floodops/domain/rewards";

export const scenario = createFunctionalScenario();
export const bike = { segment_id: "seg_edge27", vehicle_type: "motorbike", knowledge_epoch: 1 } as const;
export const car = { ...bike, vehicle_type: "car" } as const;
export const source = scenario.sourceSnapshot.sources.find(item => item.source_id === "src_citizen1")!;
export const lowObservation = scenario.sourceSnapshot.observations.find(item => item.observation_id === "obs_bike001")!;
export const hashA = "a".repeat(64), hashB = "b".repeat(64);
export const context = { session_id: "ses_reward001", generation: 1, event_sequence: 2,
  award_id: "awd_reward001", awarded_at: "2026-10-31T00:03:00Z" };
export function unknownKnowledge(scope: CoverageScope): SegmentKnowledge {
  return { ...scope, condition: "unknown", confidence_band: null, state: "ordinary_unknown",
    observation_ids: [], restriction_ids: [], expires_sim_minute: null };
}
export function known(observation: Observation, vehicle = observation.vehicle_types[0]!): SegmentKnowledge {
  return { segment_id: observation.segment_id, vehicle_type: vehicle, knowledge_epoch: observation.knowledge_epoch,
    condition: observation.condition, confidence_band: observation.confidence_band, state: "known",
    observation_ids: [observation.observation_id], restriction_ids: [], expires_sim_minute: observation.expires_sim_minute };
}
export function coverage(overrides: Partial<CoverageInput> = {}): CoverageInput {
  return { scope: [bike, car], knowledge: [unknownKnowledge(bike), unknownKnowledge(car)],
    observations: [], sources: [structuredClone(source)], now_sim_minute: 3, ...overrides };
}
export function report(overrides: Partial<Report> = {}): Report {
  return { report_id: "rpt_bike001", participant_id: "par_submit001", kind: "citizen", segment_id: bike.segment_id,
    coordinate: [106.701, 10.7705], captured_at: "2026-10-31T00:03:00Z", captured_sim_minute: 3,
    received_at: "2026-10-31T00:03:00Z", vehicle_types: ["motorbike"], description: "Synthetic accepted evidence",
    media_id: null, fixture_photo_id: "photo_fixture01", status: "accepted", reason_codes: ["ACCEPTED"],
    observation_ids: [lowObservation.observation_id], award_id: null, input_revision: 0, observation_candidates: [],
    input_mode: "photo", quick_condition: null, reporter_entity_id: "con_person001", ...overrides };
}
export function rewardInput(overrides: Partial<RewardInput> = {}): RewardInput {
  return { before: coverage(), after: coverage({ knowledge: [known(lowObservation), unknownKnowledge(car)],
    observations: [structuredClone(lowObservation)] }), report: report(),
    photo: { report_id: "rpt_bike001", normalized_hash: hashA, ready: true },
    config: { points_per_report: 7, eligible_source_ids: [source.source_id] }, context: { ...context }, ...overrides };
}
export function openedLedger(input = coverage()) {
  return proposeGapOpenings(createRewardLedger(context.session_id, context.generation, 0), input,
    { ...context, event_sequence: 1 }, [{ ...bike, gap_id: "gap_bike001" }, { ...car, gap_id: "gap_car0001" }]);
}
export function freeze<T>(value: T): T {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
export function changeSource(type: Source["source_type"]): Source { return { ...source, source_type: type }; }
