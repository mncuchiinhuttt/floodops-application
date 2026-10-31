import { createHash } from "node:crypto";
import { createRun, loadScenario, sealScenarioDraft } from "@floodops/simulation";
import type { LoadedScenario, ScenarioManifest, SimulationRun } from "@floodops/simulation";
import { createFunctionalScenario } from "@floodops/test-fixtures";
import type { SimulationPersistence, ScenarioReference } from "@floodops/domain/public-ports";
import { freezeValue } from "@floodops/domain/operations";
import { createApp } from "../../src/app/index";
import { fail } from "../../src/shared/index";
import { createSourcesFeature } from "../../src/features/sources/index";
import { scenarioCatalog as canonicalCatalog } from "../../src/index";
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const draft: ScenarioManifest = createFunctionalScenario();
draft.config.scenario.scenario_id = "scn_drivercase1";
draft.config.scenario.title = "Explicit test-authored configured driver source";
draft.sourceSnapshot.sources.push({ ...draft.sourceSnapshot.sources.find(source => source.source_id === "src_citizen1")!,
  source_id: "src_driver01", source_type: "driver", provider: "Explicit synthetic driver fixture" });
const rain = draft.sourceSnapshot.inputEvents.find(event => event.source_id === "src_rain001")!;
if (rain.measurement) { rain.measurement.unit = "cm"; rain.measurement.value = 3; }
const reopening = { ...draft.sourceSnapshot.restrictions[0]!, restriction_id: "rst_bikereopen1", vehicle_types: ["motorbike" as const], kind: "reopening" as const,
  effective_sim_minute: 2, supersedes_restriction_id: draft.sourceSnapshot.restrictions[0]!.restriction_id };
draft.sourceSnapshot.restrictions.push(reopening);
draft.sourceSnapshot.restrictions.push({ ...draft.sourceSnapshot.restrictions[0]!, restriction_id: "rst_noinput01", segment_id: "seg_edge33", effective_sim_minute: 0 });
const reopeningInput = { ...draft.sourceSnapshot.inputEvents[0]!, input_event_id: "evt_bikereopen1", fixture_event_id: "fxe_bikereopen1",
  observed_at: "2026-10-31T00:02:00Z", received_at: "2026-10-31T00:02:00Z", sim_minute: 2, restriction_id: reopening.restriction_id };
draft.sourceSnapshot.inputEvents.push(reopeningInput);
draft.config.source_fixtures.push({ fixture_event_id: reopeningInput.fixture_event_id, source_id: reopeningInput.source_id, title: "Explicit synthetic scoped reopening", role: "restriction", scheduled_sim_minute: 2 });
draft.events.push({ id: reopeningInput.input_event_id, atMinute: 2, sequence: 20, afterIds: ["evt_close17"], kind: "reopening",
  knowledge: { segment_id: "seg_edge17", vehicle_type: "motorbike", knowledge_epoch: 2, condition: "unknown", confidence_band: null,
    state: "ordinary_unknown", observation_ids: [], restriction_ids: [], expires_sim_minute: null }, supersedesRestrictionIds: [reopening.supersedes_restriction_id!] });
const driverScenario = loadScenario(sealScenarioDraft(draft, hash), hash);
const catalog = { list: () => [...canonicalCatalog.list(), driverScenario], get(id: string, version: string): LoadedScenario {
  if (id === "scn_drivercase1" && version === "1") return driverScenario;
  return canonicalCatalog.get(id, version);
} };
function reference(scenario: LoadedScenario): ScenarioReference { return { scenario_id: scenario.manifest.config.scenario.scenario_id,
  scenario_version: scenario.manifest.config.scenario.version, bundle_hash: scenario.bundleHash }; }
type RunState = Omit<SimulationRun, "scenario">;
export const persistence: SimulationPersistence<SimulationRun, RunState> = {
  reference: reference(canonicalCatalog.list()[0]!),
  read(values) {
    const saved = values.simulation as { reference: ScenarioReference; state: RunState };
    if (!saved?.reference || !saved.state) fail(503, "CONFIG_INCOMPLETE");
    const scenario = catalog.get(saved.reference.scenario_id, saved.reference.scenario_version);
    if (scenario.bundleHash !== saved.reference.bundle_hash) fail(503, "CONFIG_INCOMPLETE");
    return freezeValue({ ...structuredClone(saved.state), scenario });
  },
  write(values, run) { const { scenario, ...state } = run; return { ...values, simulation: { reference: reference(scenario), state: structuredClone(state) } }; }
};
const feature = createSourcesFeature({ scenarioCatalog: catalog, simulationPersistence: persistence });
const Base = feature.createSessionObject();
export class SessionDO extends Base {
  private readonly faults: { delete: boolean };
  constructor(ctx: DurableObjectState, env: import("../../src/shared/index").PlatformBindings) {
    const faults = { delete: false }, bucket = env.REPORT_MEDIA!;
    const wrapped = new Proxy(bucket, { get(target, property) {
      if (property === "delete") return async (...args: Parameters<R2Bucket["delete"]>) => { if (faults.delete) throw new Error("Synthetic R2 deletion outage"); return target.delete(...args); };
      const value = Reflect.get(target, property); return typeof value === "function" ? value.bind(target) : value;
    } });
    super(ctx, { ...env, REPORT_MEDIA: wrapped }); this.faults = faults;
  }
  setDeleteFault(value: boolean): void { this.faults.delete = value; }
}
export default createApp(feature.routers, { async loadScenario(id, version) {
  const scenario = catalog.get(id, version);
  return { scenario_id: id, scenario_version: version, horizon_minute: scenario.manifest.config.horizon_minute,
    calibration_status: scenario.manifest.config.scenario.calibration_status,
    entities: { driver: scenario.manifest.initial.drivers.map(driver => driver.driver_id), contributor: ["contributor_functional1"] },
    values: persistence.write({}, createRun(scenario, "run_sourcesruntime1")) };
} });
