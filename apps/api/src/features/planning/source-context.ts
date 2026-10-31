import { deriveKnowledgeSnapshot } from "@floodops/domain/knowledge";
import { deriveUsefulCoverage } from "@floodops/domain/rewards";
import { parseSchema } from "@floodops/contracts";
import type { Knowledge } from "@floodops/contracts";
import type { EvidenceContext } from "@floodops/domain/sources";
import type { SimulationRun } from "@floodops/simulation";
export function sourceContext(run: Readonly<SimulationRun>, atMinute = run.nowMs / 60000): EvidenceContext {
  return { ...run.sourceSnapshot, graph: run.scenario.manifest.graph, t0: run.scenario.manifest.config.t0,
    nowSimMinute: atMinute, profiles: run.scenario.manifest.config.source_policy_profiles,
    parameters: run.scenario.manifest.config.parameters, sourceFixtures: run.scenario.manifest.config.source_fixtures };
}
export function planningKnowledge(run: SimulationRun): Knowledge {
  const context = sourceContext(run);
  const segments = deriveKnowledgeSnapshot(run.knowledge, context);
  const relevant = run.scenario.manifest.config.relevant_scope_pairs;
  const scope = relevant.map(pair => ({ ...pair, knowledge_epoch: segments.find(k =>
    k.segment_id === pair.segment_id && k.vehicle_type === pair.vehicle_type)!.knowledge_epoch }));
  const coverage = deriveUsefulCoverage({ scope, knowledge: segments, observations: context.observations,
    sources: context.sources, now_sim_minute: context.nowSimMinute }).coverage;
  return parseSchema("Knowledge", { segments, observations: context.observations.filter(o => o.observed_sim_minute <= context.nowSimMinute),
    restrictions: context.restrictions.filter(r => r.effective_sim_minute <= context.nowSimMinute), coverage });
}
