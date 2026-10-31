import { canonicalDriverPipeline } from "./driver-source-v2-context.ts";
const { scenario, run, next, context, submitted, accepted } = await canonicalDriverPipeline();
const observation = accepted.observations.find(item => item.observation_id === context.observationId)!;
const unchanged = Object.entries(run.branches).every(([id, branch]) => JSON.stringify(branch.operations) === JSON.stringify(next.branches[id as keyof typeof next.branches]!.operations));
if (accepted.report.status !== "accepted" || observation.confidence_band !== "low" || observation.expires_sim_minute !== 6
  || accepted.report.award_id !== null || !unchanged) throw new Error("Canonical driver v2 smoke failed.");
console.log(JSON.stringify({ scenarioId: scenario.manifest.config.scenario.scenario_id, version: scenario.manifest.config.scenario.version,
  bundleHash: scenario.bundleHash, graphHash: scenario.manifest.graph.graph_hash, configHash: scenario.manifest.config.config_hash, seedHash: scenario.manifest.config.seed_hash,
  driverSource: context.sourceId, submittedStatus: submitted.report.status, acceptedStatus: accepted.report.status,
  observation: { vehicleTypes: observation.vehicle_types, confidence: observation.confidence_band, observedMinute: observation.observed_sim_minute, expiresMinute: observation.expires_sim_minute },
  award: accepted.report.award_id, committedOperationsUnchanged: unchanged, calibration: scenario.manifest.config.scenario.calibration_status }, null, 2));
