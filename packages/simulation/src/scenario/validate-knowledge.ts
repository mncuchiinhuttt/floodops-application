import type { SegmentKnowledge } from "@floodops/contracts";
import type { ScenarioEvent, ScenarioManifest } from "./scenario-types.ts";

/** Consistency validation of authored projections, not runtime source normalization. */
export function validateKnowledgeProjection(manifest: ScenarioManifest, knowledge: SegmentKnowledge, atMinute: number): void {
  const referenced = knowledge.observation_ids.map(id => manifest.sourceSnapshot.observations.find(item => item.observation_id === id)!);
  for (const observation of referenced) if (!observation || observation.segment_id !== knowledge.segment_id
    || !observation.vehicle_types.includes(knowledge.vehicle_type) || observation.knowledge_epoch !== knowledge.knowledge_epoch
    || observation.validation !== "accepted" || observation.observed_sim_minute > atMinute || observation.expires_sim_minute <= atMinute) throw new Error("Unsupported/future/expired knowledge evidence.");
  const observations = manifest.sourceSnapshot.observations.filter(item => item.segment_id === knowledge.segment_id
    && item.vehicle_types.includes(knowledge.vehicle_type) && item.knowledge_epoch === knowledge.knowledge_epoch
    && item.validation === "accepted" && item.observed_sim_minute <= atMinute && atMinute < item.expires_sim_minute);
  const available = (id: string) => manifest.sourceSnapshot.inputEvents.some(event => event.restriction_id === id && event.sim_minute <= atMinute);
  const applicable = manifest.sourceSnapshot.restrictions.filter(item => item.segment_id === knowledge.segment_id
    && item.vehicle_types.includes(knowledge.vehicle_type) && item.effective_sim_minute <= atMinute && available(item.restriction_id));
  const closures = applicable.filter(item => item.kind === "closure" && !applicable.some(reopen => reopen.kind === "reopening" && reopen.supersedes_restriction_id === item.restriction_id));
  if (closures.length && knowledge.state !== "authoritative_closed") throw new Error("Current authoritative closure cannot be omitted from projection.");
  if (closures.some(item => !knowledge.restriction_ids.includes(item.restriction_id))) throw new Error("Missing active closure reference.");
  for (const observation of observations) {
    if (!observation || observation.validation !== "accepted" || observation.observed_sim_minute > atMinute
      || observation.expires_sim_minute <= atMinute) throw new Error("Unsupported/future/expired knowledge evidence.");
    const source = manifest.sourceSnapshot.sources.find(source => source.source_id === observation.source_id)!;
    const profile = manifest.config.source_policy_profiles.find(profile => profile.policy_profile_id === source.policy_profile_id);
    if (!profile || observation.confidence_band !== profile.confidence_band || profile.ttl_sim_minute === null
      || observation.expires_sim_minute - observation.observed_sim_minute > profile.ttl_sim_minute) throw new Error("Knowledge confidence/TTL differs from configured source policy.");
  }
  if (knowledge.state === "known") {
    if (!referenced.length || !observations.length || observations.some(item => item.has_conflict || item.condition !== knowledge.condition)
      || knowledge.condition === "unknown") throw new Error("Known state lacks consistent current evidence.");
    const confidence = observations.some(item => item.confidence_band === "high") ? "high" : "low";
    const preferred = [...observations].filter(item => item.confidence_band === confidence).sort((a, b) =>
      b.observed_sim_minute - a.observed_sim_minute || (a.observation_id < b.observation_id ? -1 : a.observation_id > b.observation_id ? 1 : 0))[0]!;
    if (!knowledge.observation_ids.includes(preferred.observation_id) || knowledge.confidence_band !== confidence || knowledge.expires_sim_minute !== preferred.expires_sim_minute) throw new Error("Knowledge confidence/expiry does not match supporting evidence.");
  }
  if (knowledge.state === "ordinary_unknown" && (knowledge.condition !== "unknown" || knowledge.confidence_band !== null)) throw new Error("Unknown state cannot grant known condition/confidence.");
  if (knowledge.state === "unresolved_conflict" && (observations.length < 2
    || new Set(observations.map(item => item.condition)).size < 2)) throw new Error("Conflict needs contradictory current evidence.");
  if (knowledge.state === "authoritative_closed") {
    if (!knowledge.restriction_ids.length) throw new Error("Authoritative closure requires a restriction.");
    for (const id of knowledge.restriction_ids) {
      const restriction = manifest.sourceSnapshot.restrictions.find(item => item.restriction_id === id)!;
      if (!restriction || restriction.kind !== "closure" || restriction.effective_sim_minute > atMinute || !available(id)) throw new Error("Closure restriction is not effective at projection time.");
    }
  }
}
export function hasAuthorizedReopening(manifest: ScenarioManifest, event: ScenarioEvent): boolean {
  const knowledge = event.knowledge;
  return event.kind === "reopening" && knowledge !== null && event.supersedesRestrictionIds.length > 0
    && event.supersedesRestrictionIds.every(id => manifest.sourceSnapshot.restrictions.some(item => {
      const profile = manifest.config.source_policy_profiles.find(profile => profile.policy_profile_id === item.authority_profile_id);
      return item.kind === "reopening" && item.segment_id === knowledge.segment_id && item.vehicle_types.includes(knowledge.vehicle_type)
        && item.supersedes_restriction_id === id && item.effective_sim_minute === event.atMinute
        && profile?.is_restriction_authority === true && profile.may_reopen_restriction
        && manifest.sourceSnapshot.inputEvents.some(input => input.role === "restriction" && input.restriction_id === item.restriction_id
          && input.sim_minute <= event.atMinute && manifest.sourceSnapshot.sources.some(source => source.source_id === input.source_id && source.policy_profile_id === item.authority_profile_id));
    }));
}
