import type { RewardPolicyRef } from "@floodops/contracts";
import type { LoadedScenario, SimulationRun } from "@floodops/simulation";
import type { SimulationPersistence } from "@floodops/domain/public-ports";
import type { AppContext, Snapshot } from "../../shared/index";
export interface ReceiptPolicyContext {
  readonly sessionId: string; readonly generation: number; readonly scenarioId: string; readonly scenarioVersion: string;
  readonly receivedAt: string; readonly kind: "driver" | "citizen";
}
/** Server-only immutable reference; numeric policy evaluation belongs to Review. */
export type ReceiptRewardPolicyProvider = (context: ReceiptPolicyContext) => Readonly<RewardPolicyRef> | null;
export interface SourcesPorts {
  receiptRewardPolicy?: ReceiptRewardPolicyProvider;
  scenarioCatalog: { list(): readonly LoadedScenario[]; get(id: string, version: string): LoadedScenario };
  simulationPersistence: SimulationPersistence<SimulationRun, Omit<SimulationRun, "scenario">>;
}
export function scenarioOf(ports: SourcesPorts, snapshot: Snapshot) {
  return ports.scenarioCatalog.get(snapshot.meta.scenario_id, snapshot.meta.scenario_version);
}
export function sourceEnvironment(ports: SourcesPorts, snapshot: Snapshot) {
  const scenario = scenarioOf(ports, snapshot), run = ports.simulationPersistence.read(snapshot.values), config = scenario.manifest.config;
  return { ...run.sourceSnapshot, graph: scenario.manifest.graph, profiles: config.source_policy_profiles,
    parameters: config.parameters, sourceFixtures: config.source_fixtures, t0: config.t0, nowSimMinute: snapshot.meta.sim_minute };
}
export function id(c: AppContext, name: string): string { return c.req.param(name) ?? ""; }
