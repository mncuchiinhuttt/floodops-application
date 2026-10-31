import { cloneOperations } from "@floodops/domain/operations";
import { polylineLengthMeters } from "../graph/index.ts";
import type { HashText, ScenarioManifest } from "./scenario-types.ts";
import { canonicalJson, scenarioHashes } from "./fingerprint.ts";

/** Explicit fixture-authoring helper. Runtime creation must call loadScenario, not this. */
export function sealScenarioDraft(draft: ScenarioManifest, hash: HashText): ScenarioManifest {
  const next = structuredClone({ ...draft, initial: cloneOperations(draft.initial) });
  for (const edge of next.graph.segments) edge.length_m = polylineLengthMeters(edge.polyline);
  const contextHash = hash(canonicalJson(next.initial));
  for (const route of next.initialRoutes) {
    route.candidate_context_hash = contextHash;
    route.distance_m = route.segment_ids.reduce((sum, id) => sum + (next.graph.segments.find(edge => edge.segment_id === id)?.length_m ?? 0), 0);
  }
  const hashes = scenarioHashes(next, hash);
  next.graph.graph_hash = next.config.graph_hash = hashes.graphHash;
  next.config.config_hash = hashes.configHash; next.config.seed_hash = hashes.seedHash;
  return next;
}
