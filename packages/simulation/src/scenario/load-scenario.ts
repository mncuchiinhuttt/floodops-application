import { GraphSchema, ScenarioConfigSchema } from "@floodops/contracts";
import { freezeValue, validateOperations } from "@floodops/domain/operations";
import type { HashText, LoadedScenario, ScenarioManifest } from "./scenario-types.ts";
import { scopedParameter } from "./scenario-types.ts";
import { scenarioHashes } from "./fingerprint.ts";
import { compileWireGraph } from "./wire-graph.ts";
import { validateSourceSnapshot } from "./validate-sources.ts";
import { validateManifest } from "./validate-manifest.ts";
import { travelDurationMs } from "../graph/index.ts";
import { minutesToMilliseconds } from "../clock/index.ts";
import { assessCalibration } from "../calibration/assess-calibration.ts";

export function loadScenario(input: ScenarioManifest, hash: HashText,
  options: { requireCalibrated?: boolean; maxEvents?: number; maxSegments?: number; maxDrivers?: number } = {}): LoadedScenario {
  for (const [size, limit] of [[input.events.length, options.maxEvents ?? 10_000],
    [input.graph.segments.length, options.maxSegments ?? 20_000], [input.initial.drivers.length, options.maxDrivers ?? 100]] as const) {
    if (!Number.isSafeInteger(limit) || limit < 1 || size > limit) throw new Error("SCENARIO_RESOURCE_LIMIT");
  }
  const manifest = structuredClone(input);
  if (!["functional_fixture", "calibrated_evaluation"].includes(manifest.datasetKind)) throw new Error("Invalid dataset kind.");
  manifest.config = ScenarioConfigSchema.parse(manifest.config);
  manifest.graph = GraphSchema.parse(manifest.graph);
  validateOperations(manifest.initial);
  validateManifest(manifest, hash);
  validateSourceSnapshot(manifest);
  const hashes = scenarioHashes(manifest, hash);
  if (!hashes.graphHash || hashes.graphHash !== manifest.graph.graph_hash || hashes.graphHash !== manifest.config.graph_hash
    || hashes.configHash !== manifest.config.config_hash || hashes.seedHash !== manifest.config.seed_hash) throw new Error("SCENARIO_HASH_MISMATCH");
  const horizonMs = minutesToMilliseconds(manifest.config.horizon_minute);
  const tolerance = scopedParameter(manifest.config.parameters, "geometry_tolerance_m", "m").value!;
  if (tolerance < 0) throw new Error("Invalid geometry tolerance.");
  const routing = compileWireGraph(manifest.graph, horizonMs, tolerance);
  for (const driver of manifest.initial.drivers) {
    if (driver.status === "servicing" || (driver.position.kind === "node" && driver.status === "moving")) throw new Error("Initial status/position mismatch.");
    if (driver.position.kind === "on_edge") {
      const edge = routing.edges.find(edge => edge.id === driver.position.segment_id)!;
      const entered = minutesToMilliseconds(driver.position.entered_sim_minute!);
      const exit = minutesToMilliseconds(driver.position.exit_sim_minute!);
      if (driver.status !== "moving" || exit - entered !== travelDurationMs(edge.travel[driver.vehicle_type]!, entered)) throw new Error("Initial edge duration/status differs from frozen physics.");
      const knowledge = manifest.initialKnowledge.find(item => item.segment_id === edge.id && item.vehicle_type === driver.vehicle_type);
      if (knowledge?.state !== "known" || knowledge.confidence_band !== "high" || knowledge.condition === "impassable"
        || (knowledge.expires_sim_minute !== null && knowledge.expires_sim_minute <= 0)
        || manifest.events.some(event => event.atMinute === 0 && event.knowledge?.segment_id === edge.id
          && event.knowledge.vehicle_type === driver.vehicle_type && (event.knowledge.state !== "known" || event.knowledge.confidence_band !== "high" || event.knowledge.condition === "impassable"))) throw new Error("Initial edge entry lacks current unblocked evidence.");
    }
  }
  const calibration = assessCalibration(manifest);
  if ((options.requireCalibrated || manifest.config.scenario.calibration_status === "validated") && calibration.status !== "validated") throw new Error("CALIBRATION_INCOMPLETE");
  return freezeValue({ manifest, routing, bundleHash: hashes.bundleHash, horizonMs });
}
