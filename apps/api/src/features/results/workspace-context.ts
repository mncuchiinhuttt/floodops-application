import { freezeValue } from "@floodops/domain/operations";
import { parseSchema } from "@floodops/contracts";
import { fail, PlatformError } from "../../shared/index";
import type { TransitionContext } from "../../shared/index";
import type { WorkspaceProjectionPorts } from "./workspace-types";

export function workspaceContext<State>(context: TransitionContext, ports: Partial<WorkspaceProjectionPorts<State>>) {
  const input = freezeValue(structuredClone(context)), { snapshot } = input;
  const marker = snapshot.values.runtime_contract as { serialization?: string; version?: string } | undefined;
  if (marker?.serialization !== "m1-v1" || marker.version !== "0.5.0-m1" || !ports.persistence) fail(503, "CONFIG_INCOMPLETE");
  const run = ports.persistence.read(snapshot.values), meta = snapshot.meta, reference = ports.persistence.reference;
  if (meta.scenario_id !== reference.scenario_id || meta.scenario_version !== reference.scenario_version
    || run.scenario.bundleHash !== reference.bundle_hash || meta.sim_minute !== run.nowMs / 60000
    || meta.horizon_minute !== run.scenario.manifest.config.horizon_minute) fail(503, "CONFIG_INCOMPLETE");
  return { input, run, scenario: parseSchema("ScenarioSummary", run.scenario.manifest.config.scenario) };
}
export function projected<T>(port: ((context: TransitionContext) => T) | undefined, context: TransitionContext): T {
  if (typeof port !== "function") fail(503, "CONFIG_INCOMPLETE");
  let value: T;
  try { value = port(context); } catch (error) {
    if (error instanceof PlatformError) throw error;
    fail(503, "CONFIG_INCOMPLETE");
  }
  if (value === undefined || value === null) fail(503, "CONFIG_INCOMPLETE");
  if (value && typeof (value as { then?: unknown }).then === "function") fail(503, "CONFIG_INCOMPLETE");
  return value;
}
