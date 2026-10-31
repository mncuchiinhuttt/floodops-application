import type { DriverReportInput, Participant } from "@floodops/contracts";
import { proposeReportSubmission } from "@floodops/domain/reporting";
import { proposeObservationAcceptance } from "@floodops/domain/knowledge";
import { advanceRun, applyKnowledgeTransition, createRun, loadScenario } from "@floodops/simulation";
import type { ScenarioManifest } from "@floodops/simulation";
import { hash, highOnly } from "./test-context.ts";

export async function canonicalDriverPipeline() {
  const manifest = await Bun.file(new URL("../../../../data/scenarios/functional-v2/manifest.json", import.meta.url)).json() as ScenarioManifest;
  const scenario = loadScenario(manifest, hash), config = scenario.manifest.config;
  const run = advanceRun(createRun(scenario, "run_driver_v2"), 3, highOnly).run;
  const drivers = run.sourceSnapshot.sources.filter(source => source.source_type === "driver" && source.role === "observation");
  if (drivers.length !== 1) throw new Error("CONFIG_INCOMPLETE: unique canonical driver Source required.");
  const participant: Participant = { participant_id: "ptr_driver01", role: "driver", bound_entity_id: "drv_moto01",
    expires_at: "2026-11-01T00:00:00Z", permissions: ["reports:submit"], is_owner: false };
  const context = { ...run.sourceSnapshot, graph: scenario.manifest.graph, t0: config.t0, nowSimMinute: 3,
    profiles: config.source_policy_profiles, parameters: config.parameters, sourceFixtures: config.source_fixtures,
    participant, boundVehicleTypes: ["motorbike" as const], dispatcherEntities: [], sourceId: drivers[0]!.source_id,
    reportId: "rpt_driver_v2", inputRevision: 3, receivedAt: "2026-10-31T00:03:00Z", epochs: run.knowledge,
    fixtureAssets: config.fixture_assets, media: null, observationId: "obs_driver_v2", reasonId: "driver-quick-v2" };
  const input: DriverReportInput = { kind: "driver", input_mode: "quick", quick_condition: "normal", segment_id: "seg_edge27",
    coordinate: [106.701, 10.7705], captured_at: context.receivedAt, captured_sim_minute: 3,
    vehicle_types: ["motorbike"], description: "Synthetic driver quick report; canonical functional version2." };
  const submitted = proposeReportSubmission(input, context);
  const accepted = proposeObservationAcceptance(submitted.report, "normal", run.knowledge, { ...context, epochs: submitted.capturedEpochs });
  const next = applyKnowledgeTransition(run, accepted.knowledge, { sourceSnapshot: { ...run.sourceSnapshot, observations: accepted.observations }, reasonId: context.reasonId });
  return { scenario, run, next, context, input, submitted, accepted };
}
