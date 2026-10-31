import { parseSchema } from "@floodops/contracts";
import type { SimulationRun } from "@floodops/simulation";
import type { TransitionContext } from "../../src/shared/index";
export function runtimeContext(run: SimulationRun): TransitionContext {
  const config = run.scenario.manifest.config;
  const meta = parseSchema("SessionMeta", { session_id: "ses_runtime01", generation: 0, revision: 0, event_sequence: 0,
    scenario_id: config.scenario.scenario_id, scenario_version: config.scenario.version,
    sim_minute: run.nowMs / 60000, horizon_minute: config.horizon_minute, status: "active", calibration_status: "incomplete",
    created_at: "2026-10-31T00:00:00Z", expires_at: "2026-10-31T01:00:00Z" });
  const reference = { scenario_id: meta.scenario_id, scenario_version: meta.scenario_version, bundle_hash: run.scenario.bundleHash };
  const values = { runtime_contract: { serialization: "m1-v1", version: "0.5.0-m1" }, simulation: { reference, state: {} } };
  return { snapshot: { meta, values, seed: { scenario_id: meta.scenario_id, scenario_version: meta.scenario_version,
    horizon_minute: meta.horizon_minute, calibration_status: meta.calibration_status,
    entities: { driver: run.scenario.manifest.initial.drivers.map(d => d.driver_id), contributor: [] }, values },
    absoluteExpiry: Date.parse(meta.expires_at), pointers: {}, leases: {} },
  actor: { participant: parseSchema("Participant", { participant_id: "par_runtime01", role: "dispatcher",
    bound_entity_id: null, expires_at: meta.expires_at, permissions: ["planning:execute", "planning:request", "planning:decide", "operations:read"],
    is_owner: true }) }, now: Date.parse(meta.created_at) };
}
