import { createHash } from "node:crypto";
import { createRun, loadScenario, type ScenarioManifest, type SimulationRun } from "@floodops/simulation";
import { freezeValue } from "@floodops/domain/operations";
import type { ScenarioReference, SimulationPersistence } from "@floodops/domain/public-ports";
import manifest from "../../../data/scenarios/functional-v2/manifest.json";
import legacyManifest from "../../../data/scenarios/functional-v1/manifest.json";
import { createApp } from "./app/index";
import { fail, type SessionSeed, type RuntimeRegistry } from "./shared/index";
import { createSimulationRuntime } from "./features/simulation/index";
import { createResultsRouter, createResultsView, RESULTS_VIEW } from "./features/results/index";
import { createSourcesFeature } from "./features/sources/index";

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
export async function loadSessionScenario(id: string, version: string): Promise<SessionSeed> {
  if (id !== scenarioReference.scenario_id || version !== scenarioReference.scenario_version) fail(404, "NOT_FOUND");
  scenarioCatalog.get(id, version);
  return {
    scenario_id: id, scenario_version: version,
    horizon_minute: scenario.manifest.config.horizon_minute,
    calibration_status: scenario.manifest.config.scenario.calibration_status,
    // Explicit synthetic admission roster; not a source/caption-derived identity or an account.
    entities: { driver: scenario.manifest.initial.drivers.map(driver => driver.driver_id), contributor: ["contributor_functional1"] },
    values: simulationPersistence.write({}, createRun(scenario, "run_initial"))
  };
}
// Real read projections are available now. Advance stays fail-closed until the
// Planner owner publishes the independent committed policy; never inject a test policy.
const simulation = createSimulationRuntime({ persistence: simulationPersistence });
const sources = createSourcesFeature({ scenarioCatalog, simulationPersistence });
const registry: RuntimeRegistry = {
  ...simulation.registry,
  commands: { ...sources.registry.commands, ...simulation.registry.commands },
  views: { ...sources.registry.views, ...simulation.registry.views, [RESULTS_VIEW]: createResultsView(simulationPersistence) }
};
// Preserve media recovery intents/table/alarm around the full combined registry.
const RegisteredSessionDO = sources.createSessionObject(registry);
export class SessionDO extends RegisteredSessionDO {}
export default createApp([...sources.routers, simulation.router, createResultsRouter()], { loadScenario: loadSessionScenario });

