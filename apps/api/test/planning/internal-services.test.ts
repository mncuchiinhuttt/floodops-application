import { createPlanningRuntime } from "../../src/features/planning/index";
import { expirePlanning } from "../../src/features/planning/job-leases";
import { runtimeContext } from "./runtime-unit-context";
import { runFixture } from "./planning-context";
import { expect, test } from "bun:test";
import { getToolDefinitions, getInternalServiceDefinitions, internalServices, RuntimeCommanderDisabledError,
  parseInternalServiceInput } from "@floodops/contracts";
test("M1 operational model tools fail closed and direct service inputs stay strict", () => {
  expect(() => getToolDefinitions()).toThrow(RuntimeCommanderDisabledError);
  expect(Object.keys(internalServices).sort()).toEqual(getInternalServiceDefinitions().map(d => d.name).sort());
  expect(Object.keys(internalServices)).toHaveLength(8);
  expect(() => parseInternalServiceInput("compute_route", { driver_id: "drv_moto01", origin_node_id: "node_hubAAA",
    stop_refs: [], assignment_overrides: [], execute: true })).toThrow();
});

test("planner metadata freezes actual bounds/config while legacy expiry is preserved unchanged", () => {
  const run = runFixture(), context = runtimeContext(run), reference = { scenario_id: context.snapshot.meta.scenario_id,
    scenario_version: context.snapshot.meta.scenario_version, bundle_hash: run.scenario.bundleHash };
  const persistence = { reference, read: () => run, write: (values: Record<string, unknown>) => ({ ...values, simulation: { reference, state: run } }) };
  const first = createPlanningRuntime({ persistence, search: { maxCandidates: 3 } }).planner;
  const same = createPlanningRuntime({ persistence, search: { maxCandidates: 3 } }).planner;
  const other = createPlanningRuntime({ persistence, search: { maxCandidates: 4 } }).planner;
  expect(first).toEqual(same); expect(first.search_limit).toBe(3); expect(first.config_hash).not.toBe(other.config_hash);
  delete context.snapshot.values.runtime_contract;
  const before = structuredClone(context.snapshot.values);
  expect(expirePlanning(context.snapshot, { lease_id: "lease_legacy01", job_id: "job_legacy01", kind: "planning", generation: 0,
    revision: 0, bind_revision: true, nonce_digest: "0".repeat(64), expires_at: 0, status: "failed", error_code: "MODEL_TIMEOUT" }, Date.now())).toEqual(before);
});
