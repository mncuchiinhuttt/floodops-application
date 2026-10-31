import { SourceSchema, InputEventSchema, ObservationSchema, RestrictionSchema } from "@floodops/contracts";
import { hasAuthorizedReopening, validateKnowledgeProjection } from "./validate-knowledge.ts";
import type { ScenarioManifest } from "./scenario-types.ts";

export function validateSourceSnapshot(manifest: ScenarioManifest): void {
  const snapshot = manifest.sourceSnapshot, profiles = manifest.config.source_policy_profiles;
  snapshot.sources.forEach(source => SourceSchema.parse(source)); snapshot.inputEvents.forEach(event => InputEventSchema.parse(event));
  snapshot.observations.forEach(observation => ObservationSchema.parse(observation)); snapshot.restrictions.forEach(restriction => RestrictionSchema.parse(restriction));
  for (const ids of [snapshot.sources.map(item => item.source_id), snapshot.inputEvents.map(item => item.input_event_id),
    snapshot.observations.map(item => item.observation_id), snapshot.restrictions.map(item => item.restriction_id), profiles.map(item => item.policy_profile_id)]) {
    if (new Set(ids).size !== ids.length) throw new Error("Duplicate source snapshot IDs.");
  }
  for (const source of snapshot.sources) if (source.policy_profile_id !== null && !profiles.some(profile => profile.policy_profile_id === source.policy_profile_id)) throw new Error("Unknown source policy.");
  for (const profile of profiles) for (const key of profile.parameter_keys) if (!manifest.config.parameters.some(parameter => parameter.key === key)) throw new Error("Unknown source parameter.");
  for (const profile of profiles) {
    const parameters = profile.parameter_keys.map(key => manifest.config.parameters.find(item => item.key === key)!);
    if ((profile.ttl_sim_minute !== null && !parameters.some(item => item.unit === "minute" && item.value === profile.ttl_sim_minute))
      || (profile.location_tolerance_m !== null && !parameters.some(item => item.unit === "m" && item.value === profile.location_tolerance_m))) throw new Error("Source policy parameters differ from declared values/units.");
  }
  for (const observation of snapshot.observations) {
    const source = snapshot.sources.find(source => source.source_id === observation.source_id);
    const edge = manifest.graph.segments.find(edge => edge.segment_id === observation.segment_id);
    if (!source || source.role !== "observation" || !edge || observation.vehicle_types.some(vehicle => !edge.allowed_vehicle_types.includes(vehicle))
      || observation.expires_sim_minute <= observation.observed_sim_minute) throw new Error("Invalid observation source/segment/vehicle/time.");
  }
  for (const restriction of snapshot.restrictions) {
    const edge = manifest.graph.segments.find(edge => edge.segment_id === restriction.segment_id);
    const profile = profiles.find(profile => profile.policy_profile_id === restriction.authority_profile_id);
    if (!edge || restriction.vehicle_types.some(vehicle => !edge.allowed_vehicle_types.includes(vehicle)) || !profile?.is_restriction_authority
      || (restriction.kind === "reopening" && (!profile.may_reopen_restriction || !snapshot.restrictions.some(item => item.restriction_id === restriction.supersedes_restriction_id && item.kind === "closure" && item.segment_id === restriction.segment_id && item.effective_sim_minute <= restriction.effective_sim_minute && restriction.vehicle_types.every(vehicle => item.vehicle_types.includes(vehicle)))))) throw new Error("Invalid restriction authority/reference.");
  }
  for (const event of snapshot.inputEvents) {
    const source = snapshot.sources.find(source => source.source_id === event.source_id);
    if (!source || source.role !== event.role || !manifest.config.source_fixtures.some(fixture => fixture.fixture_event_id === event.fixture_event_id && fixture.source_id === source.source_id)
      || (event.restriction_id !== null && !snapshot.restrictions.some(item => item.restriction_id === event.restriction_id && item.authority_profile_id === source.policy_profile_id))) throw new Error("Invalid input source/fixture/restriction.");
  }
  for (const event of manifest.events) if (event.kind === "reopening" && !hasAuthorizedReopening(manifest, event)) throw new Error("Reopening needs actual authorized source restriction.");
  for (const knowledge of manifest.initialKnowledge) validateKnowledgeProjection(manifest, knowledge, 0);
  for (const event of manifest.events) if (event.knowledge) validateKnowledgeProjection(manifest, event.knowledge, event.atMinute);
  for (const knowledge of [...manifest.initialKnowledge, ...manifest.events.flatMap(event => event.knowledge ? [event.knowledge] : [])]) {
    for (const id of knowledge.observation_ids) if (!snapshot.observations.some(item => item.observation_id === id && item.segment_id === knowledge.segment_id
      && item.vehicle_types.includes(knowledge.vehicle_type) && item.knowledge_epoch === knowledge.knowledge_epoch && item.validation === "accepted")) throw new Error("Unknown/mismatched current observation reference.");
    for (const id of knowledge.restriction_ids) if (!snapshot.restrictions.some(item => item.restriction_id === id && item.segment_id === knowledge.segment_id && item.vehicle_types.includes(knowledge.vehicle_type))) throw new Error("Unknown restriction knowledge reference.");
  }
}
