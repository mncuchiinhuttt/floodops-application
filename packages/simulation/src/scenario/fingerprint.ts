import type { HashText, ScenarioManifest } from "./scenario-types.ts";

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ":" + canonicalJson((value as Record<string, unknown>)[key])).join(",") + "}";
  throw new Error("Unhashable scenario content.");
}
export function scenarioHashes(manifest: ScenarioManifest, hash: HashText) {
  const graphHash = hash(canonicalJson({ nodes: manifest.graph.nodes, segments: manifest.graph.segments }));
  const { config_hash: _config, seed_hash: _seed, ...config } = manifest.config;
  void _config; void _seed;
  const configHash = hash(canonicalJson({ ...config, graph_hash: graphHash }));
  const seedHash = hash(canonicalJson({ initial: manifest.initial, initialRoutes: manifest.initialRoutes,
    initialKnowledge: manifest.initialKnowledge, sourceSnapshot: manifest.sourceSnapshot, events: manifest.events, hubWindows: manifest.hubWindows,
    seed: manifest.seed, datasetKind: manifest.datasetKind, licence: manifest.licence,
    aliases: manifest.aliases, calibration: manifest.calibration }));
  return { graphHash, configHash, seedHash, bundleHash: hash(canonicalJson({ graphHash, configHash, seedHash })) };
}
