import { ObservationSchema, ScopePairSchema, SegmentKnowledgeSchema, SourceSchema, validate } from "@floodops/contracts";
import type { CoverageInput, UsefulCoverage } from "./types.ts";
import { RewardProposalError } from "./types.ts";
import { immutable, integer, scopeKey, unique } from "./validation.ts";

/** Consumes normalized current knowledge; does not accept, resolve or reopen evidence. */
export function deriveUsefulCoverage(input: CoverageInput): UsefulCoverage {
  if (!Number.isFinite(input.now_sim_minute) || input.now_sim_minute < 0) {
    throw new RewardProposalError("INVALID_CONTEXT", "Explicit simulation time required.");
  }
  for (const scope of input.scope) {
    validate(ScopePairSchema, { segment_id: scope.segment_id, vehicle_type: scope.vehicle_type }, "Coverage.scope");
    integer(scope.knowledge_epoch, "knowledge epoch");
  }
  unique(input.scope.map(item => JSON.stringify([item.segment_id, item.vehicle_type])), "relevant pair");
  for (const knowledge of input.knowledge) validate(SegmentKnowledgeSchema, knowledge, "Coverage.knowledge");
  for (const observation of input.observations) validate(ObservationSchema, observation, "Coverage.observation");
  for (const source of input.sources) validate(SourceSchema, source, "Coverage.source");
  unique(input.knowledge.map(item => JSON.stringify([item.segment_id, item.vehicle_type])), "current knowledge pair");
  unique(input.observations.map(item => item.observation_id), "observation id");
  unique(input.sources.map(item => item.source_id), "source id");
  const pairs = input.scope.map(scope => {
    const knowledge = input.knowledge.find(item => scopeKey(item) === scopeKey(scope));
    const usable = knowledge?.state === "known" && knowledge.condition !== "unknown" && knowledge.confidence_band !== null
      && knowledge.expires_sim_minute !== null && input.now_sim_minute < knowledge.expires_sim_minute;
    const observation_ids = usable ? input.observations.filter(observation => {
      const source = input.sources.find(item => item.source_id === observation.source_id);
      return knowledge.observation_ids.includes(observation.observation_id) && observation.segment_id === scope.segment_id
        && observation.knowledge_epoch === scope.knowledge_epoch && observation.vehicle_types.includes(scope.vehicle_type)
        && observation.condition === knowledge.condition && observation.validation === "accepted" && !observation.has_conflict
        && observation.observed_sim_minute <= input.now_sim_minute && input.now_sim_minute < observation.expires_sim_minute
        && source?.role === "observation" && source.access_status === "available";
    }).map(item => item.observation_id).sort() : [];
    return { scope: { ...scope }, observation_ids, covered: observation_ids.length > 0 };
  });
  const covered_pairs = pairs.filter(item => item.covered).length, relevant_pairs = pairs.length;
  return immutable({ pairs, coverage: { covered_pairs, relevant_pairs, ratio: relevant_pairs ? covered_pairs / relevant_pairs : null } });
}

export function assertCoverageTransition(before: CoverageInput, after: CoverageInput): void {
  const oldScope = before.scope.map(scopeKey).sort(), newScope = after.scope.map(scopeKey).sort();
  if (before.now_sim_minute !== after.now_sim_minute || JSON.stringify(oldScope) !== JSON.stringify(newScope)) {
    throw new RewardProposalError("INVALID_CONTEXT", "Before/after must share frozen scope, epoch and clock.");
  }
}
