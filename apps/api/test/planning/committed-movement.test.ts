import { expect, test } from "bun:test";
import { checkEntry } from "@floodops/simulation";
import { createCommittedMovementPolicy } from "../../src/features/planning/index";
import { planningKnowledge } from "../../src/features/planning/source-context";
import { readPlanningState, planningValues } from "../../src/features/planning/runtime-state";
import { moto, runFixture } from "./planning-context.ts";
import { runtimeContext } from "./runtime-unit-context";
test("production committed policy validates genuine source facts and permits fresh known road", () => {
  const run = runFixture(), context = runtimeContext(run), before = JSON.stringify(run);
  const policy = createCommittedMovementPolicy(context, run), driver = run.branches.floodops!.operations.drivers[0]!;
  expect(checkEntry(run, "floodops", driver, "seg_edge17", 0, policy)).toEqual({ allowed: true, reason: "POL-08" });
  expect(JSON.stringify(run)).toBe(before);
});
test("new proposals and approvals never create a persisted unknown movement grant", () => {
  const run = runFixture();
  for (const observation of run.sourceSnapshot.observations) if (observation.segment_id === "seg_edge17"
    && observation.vehicle_types.includes("motorbike")) observation.validation = "superseded";
  run.knowledge = planningKnowledge(run).segments;
  const context = runtimeContext(run), state = readPlanningState(context.snapshot);
  context.snapshot.pointers = { latest_plan_id: "pln_other001", latest_requested_job_id: "job_other001" };
  context.snapshot.values = planningValues(context.snapshot, state);
  const policy = createCommittedMovementPolicy(context, run), driver = run.branches.floodops!.operations.drivers.find(d => d.driver_id === moto)!;
  for (const branch of ["static", "floodops", "reroute_only"] as const) {
    expect(checkEntry(run, branch, driver, "seg_edge17", 0, policy).allowed).toBe(false);
  }
});
test("production committed factory fails closed on mismatched scenario/clock and missing source configuration", () => {
  const run = runFixture(), context = runtimeContext(run); context.snapshot.meta.sim_minute = 1;
  expect(() => createCommittedMovementPolicy(context, run)).toThrow();
  context.snapshot.meta.sim_minute = 0; run.scenario.manifest.config.source_policy_profiles = [];
  expect(() => createCommittedMovementPolicy(context, run)).toThrow();
});
