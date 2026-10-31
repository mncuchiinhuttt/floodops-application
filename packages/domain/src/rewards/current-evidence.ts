import type { CoverageInput, CoverageScope } from "./types.ts";

/** Selects facts for one current pair; aggregate has_conflict cannot identify that pair. */
export function currentScopeEvidence(input: CoverageInput, scope: CoverageScope) {
  return input.observations.filter(observation => {
    const source = input.sources.find(item => item.source_id === observation.source_id);
    return observation.segment_id === scope.segment_id && observation.vehicle_types.includes(scope.vehicle_type)
      && observation.knowledge_epoch === scope.knowledge_epoch && observation.validation === "accepted"
      && observation.observed_sim_minute <= input.now_sim_minute && input.now_sim_minute < observation.expires_sim_minute
      && source?.role === "observation" && source.access_status === "available";
  });
}
