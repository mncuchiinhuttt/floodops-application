import { createHash } from "node:crypto";
import { createRun, loadScenario, type ScenarioManifest, type SimulationRun } from "@floodops/simulation";
import { freezeValue } from "@floodops/domain/operations";
import type { ScenarioReference, SimulationPersistence } from "@floodops/domain/public-ports";
import manifest from "../../../data/scenarios/functional-v1/manifest.json";
import { createApp } from "./app/index";
import { createSessionObject } from "./session-runtime/index";
import { fail, type SessionSeed, type RuntimeRegistry } from "./shared/index";

const scenario = loadScenario(manifest as unknown as ScenarioManifest, text => createHash("sha256").update(text).digest("hex"));
export const scenarioReference: ScenarioReference = Object.freeze({
  scenario_id: scenario.manifest.config.scenario.scenario_id,
  scenario_version: scenario.manifest.config.scenario.version,
  bundle_hash: scenario.bundleHash
});
/** Private immutable producer catalog, not a client authorization boundary. */
export const scenarioCatalog = {
  list: () => [scenario] as const,
  get(id: string, version: string) {
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
// Business owners supply reducers/projections; absent features fail closed (CONFIG_INCOMPLETE).
const registry: RuntimeRegistry = {};
const RegisteredSessionDO = createSessionObject(registry);
export class SessionDO extends RegisteredSessionDO {}
export default createApp([], { loadScenario: loadSessionScenario });

