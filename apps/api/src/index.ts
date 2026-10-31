import { createHash } from "node:crypto";
import { parseSchema } from "@floodops/contracts";
import { deriveUsefulCoverage } from "@floodops/domain/rewards";
import { createRun, loadScenario, type ScenarioManifest, type SimulationRun } from "@floodops/simulation";
import { freezeValue } from "@floodops/domain/operations";
import type { ScenarioReference, SimulationPersistence } from "@floodops/domain/public-ports";
import manifest from "../../../data/scenarios/functional-v2/manifest.json";
import legacyManifest from "../../../data/scenarios/functional-v1/manifest.json";
import { createApp } from "./app/index";
import { fail, type SessionSeed, type RuntimeRegistry, type TransitionContext } from "./shared/index";
import { createSimulationRuntime } from "./features/simulation/index";
import { createResultsRouter, createResultsView, createWorkspaceViews, RESULTS_VIEW, type WorkspacePlanning } from "./features/results/index";
import { createSourcesFeature } from "./features/sources/index";
import { createPlanningRuntime, DEFAULT_SEARCH_LIMITS } from "./features/planning/index";
import { createReviewSeed, createSourceBackedReviewRuntime, reconcileReviewGaps } from "./features/reports/review/index";

const scenario = loadScenario(manifest as unknown as ScenarioManifest, text => createHash("sha256").update(text).digest("hex"));
const legacyScenario = loadScenario(legacyManifest as unknown as ScenarioManifest, text => createHash("sha256").update(text).digest("hex"));
export const scenarioReference: ScenarioReference = Object.freeze({
  scenario_id: scenario.manifest.config.scenario.scenario_id,
  scenario_version: scenario.manifest.config.scenario.version,
  bundle_hash: scenario.bundleHash
});
/** Private immutable producer catalog, not a client authorization boundary. */
export const scenarioCatalog = {
  list: () => [scenario] as const,
  get(id: string, version: string) {
    // Retain the immutable historical bundle for explicit read-only/fixture consumers.
    if (id === legacyScenario.manifest.config.scenario.scenario_id && version === legacyScenario.manifest.config.scenario.version) return legacyScenario;
    if (id !== scenarioReference.scenario_id || version !== scenarioReference.scenario_version) fail(404, "NOT_FOUND");
    return scenario;
  }
};
type RunState = Omit<SimulationRun, "scenario">;
/** Server-owned persistence only; never use as an authorized client projection. */
export const simulationPersistence: SimulationPersistence<SimulationRun, RunState> = {
  reference: scenarioReference,
  read(values) {
    const checkpoint = values.simulation as { reference?: ScenarioReference; state?: RunState } | undefined;
    if (!checkpoint?.state || checkpoint.reference?.scenario_id !== scenarioReference.scenario_id
      || checkpoint.reference.scenario_version !== scenarioReference.scenario_version
      || checkpoint.reference.bundle_hash !== scenarioReference.bundle_hash) fail(503, "CONFIG_INCOMPLETE");
    return freezeValue({ ...structuredClone(checkpoint.state), scenario });
  },
  write(values, run) {
    const { scenario: bundle, ...state } = run;
    if (bundle.bundleHash !== scenario.bundleHash) fail(503, "CONFIG_INCOMPLETE");
    return { ...values, simulation: { reference: scenarioReference, state: structuredClone(state) } };
  }
};
function sessionSeed(id: string, version: string): SessionSeed {
  if (id !== scenarioReference.scenario_id || version !== scenarioReference.scenario_version) fail(404, "NOT_FOUND");
  scenarioCatalog.get(id, version);
  const run = createRun(scenario, "run_initial");
  const reviewRewardsSeed = createReviewSeed({
    scope: scenario.manifest.config.relevant_scope_pairs.map(pair => ({ ...pair,
      knowledge_epoch: run.knowledge.find(item => item.segment_id === pair.segment_id && item.vehicle_type === pair.vehicle_type)?.knowledge_epoch
        ?? fail(503, "CONFIG_INCOMPLETE") })),
    knowledge: run.knowledge, observations: run.sourceSnapshot.observations,
    sources: run.sourceSnapshot.sources, now_sim_minute: run.nowMs / 60000
  });
  return {
    scenario_id: id, scenario_version: version,
    horizon_minute: scenario.manifest.config.horizon_minute,
    calibration_status: scenario.manifest.config.scenario.calibration_status,
    // Explicit synthetic admission roster; not a source/caption-derived identity or an account.
    entities: { driver: scenario.manifest.initial.drivers.map(driver => driver.driver_id), contributor: ["contributor_functional1"] },
    values: simulationPersistence.write({ runtime_contract: { serialization: "m1-v1", version: "0.5.0-m1" }, reviewRewardsSeed }, run)
  };
}
export async function loadSessionScenario(id: string, version: string): Promise<SessionSeed> { return sessionSeed(id, version); }
const ports = { scenarioCatalog, simulationPersistence };
const sources = createSourcesFeature(ports);
// Missing numeric reward policy remains pending_config; missing vision provider stays unavailable.
const review = createSourceBackedReviewRuntime(ports, {});
function coverageInput(context: TransitionContext) {
  const state = review.source.read(context);
  return { scope: state.relevantScope, knowledge: state.knowledge, observations: state.evidence.observations,
    sources: state.evidence.sources, now_sim_minute: context.snapshot.meta.sim_minute };
}
function projected(registry: RuntimeRegistry, name: string, context: TransitionContext) {
  const view = registry.views?.[name]; if (!view) fail(503, "CONFIG_INCOMPLETE"); return view.project(context);
}
// Genuine bounded deterministic runtime; no provider/key/model transport is injected.
const planning = createPlanningRuntime({ persistence: simulationPersistence, search: DEFAULT_SEARCH_LIMITS });
const simulation = createSimulationRuntime({ persistence: simulationPersistence, committedPolicy: planning.committedPolicy,
  afterAdvance: ({ context, values }) => ({ ...values, reviewRewards: reconcileReviewGaps(context, coverageInput(context)) }) });
const workspaces = createWorkspaceViews({ persistence: simulationPersistence,
  clock: context => parseSchema("SimulationClock", projected(simulation.registry, "simulation.clock", context)),
  knowledge: context => parseSchema("Knowledge", projected(sources.registry, "source-knowledge", context)),
  operations: context => parseSchema("Operations", projected(planning.registry, "planning.operations", context)),
  impact: context => parseSchema("Impact", projected(planning.registry, "planning.impact", context)),
  planning: context => projected(planning.registry, "planning.state", context) as WorkspacePlanning,
  routes(context) {
    const rows = projected(planning.registry, "planning.routes", context); if (!Array.isArray(rows)) fail(503, "CONFIG_INCOMPLETE");
    return rows.map(row => parseSchema("Route", row));
  },
  reports: context => review.source.read(context).reports.map(report => ({ generation: context.snapshot.meta.generation, report })),
  coverage: context => deriveUsefulCoverage(coverageInput(context)).coverage
});
const registry: RuntimeRegistry = {
  ...simulation.registry,
  ...review.registry, serialization: "m1-v1", seedForReset: previous => sessionSeed(previous.scenario_id, previous.scenario_version),
  commands: { ...sources.registry.commands, ...simulation.registry.commands, ...planning.registry.commands, ...review.registry.commands },
  views: { ...sources.registry.views, ...simulation.registry.views, ...planning.registry.views, ...review.registry.views,
    ...workspaces, [RESULTS_VIEW]: createResultsView(simulationPersistence) },
  onLeaseExpired(snapshot, lease, now) {
    let values = snapshot.values;
    for (const feature of [sources, simulation, planning]) {
      if (feature.registry.onLeaseExpired) values = feature.registry.onLeaseExpired({ ...snapshot, values }, lease, now);
    }
    return values;
  }
};
// Preserve media recovery intents/table/alarm around the full combined registry.
const RegisteredSessionDO = sources.createSessionObject(registry);
export class SessionDO extends RegisteredSessionDO {}
export default createApp([...sources.routers, planning.router, review.router, simulation.router, createResultsRouter()], { loadScenario: loadSessionScenario });

