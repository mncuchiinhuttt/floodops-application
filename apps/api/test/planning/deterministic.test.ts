import { expect, test } from "bun:test";
import { validateOperations } from "@floodops/domain/operations";
import { compareObjectives } from "@floodops/simulation";
import type { SimulationRun } from "@floodops/simulation";
import { createPlanningRuntime, runDeterministicPlanner, searchLimits, PlanningSearchStopped } from "../../src/features/planning/index";
import type { PlanningRuntimeOptions } from "../../src/features/planning/runtime-types";
import { runFixture } from "./planning-context";
import { runtimeContext } from "./runtime-unit-context";
function fixture(run = runFixture()) {
  const context = runtimeContext(run), reference = { scenario_id: context.snapshot.meta.scenario_id,
    scenario_version: context.snapshot.meta.scenario_version, bundle_hash: run.scenario.bundleHash };
  const options: PlanningRuntimeOptions<SimulationRun> = { persistence: { reference, read: () => run,
    write: (values, state) => ({ ...values, simulation: { reference, state } }) },
    provider: { async respond() { throw new Error("No runtime model authority."); } } };
  return { context, options };
}
async function search(run = runFixture(), job = "job_search001", maxCandidates = 16) {
  const { context, options } = fixture(run);
  return runDeterministicPlanner(context, run, job, "plan_search001", options, searchLimits({ maxCandidates }),
    { deadline: Date.now() + 60000, current: async () => true });
}
test("deterministic search uses actual projections, structural tie-break and no model transport", async () => {
  const run = runFixture(), before = JSON.stringify(run), first = await search(run), second = await search(run, "job_search002");
  expect(first.search.outcome).toBe("candidate");
  expect(["ready", "pending_approval"]).toContain(first.plan.status);
  expect(compareObjectives(first.plan.objective_after, first.plan.objective_before)).toBeLessThanOrEqual(0);
  expect(first.search.selected_key).toBe(second.search.selected_key);
  expect(first.plan.objective_after).toEqual(second.plan.objective_after);
  expect(first.routes.map(r => [r.driver_id, r.segment_ids])).toEqual(second.routes.map(r => [r.driver_id, r.segment_ids]));
  expect(JSON.stringify(run)).toBe(before);
}, 60000);
test("stable ties ignore incidental driver/order array order", async () => {
  const run = runFixture(), first = await search(run);
  run.branches.floodops!.operations = { ...run.branches.floodops!.operations,
    drivers: [...run.branches.floodops!.operations.drivers].reverse(), orders: [...run.branches.floodops!.operations.orders].reverse() };
  const second = await search(run, "job_reorder1");
  expect(second.search.selected_key).toBe(first.search.selected_key);
  expect(second.plan.objective_after).toEqual(first.plan.objective_after);
}, 60000);
test("declared candidate budget is enforced and reports truncation", async () => {
  const result = await search(runFixture(), "job_bounded1", 1);
  expect(result.search.evaluated).toBe(1); expect(result.search.truncated).toBe(true);
  expect(result.search.limits.maxCandidates).toBe(1);
  expect(() => searchLimits({ maxCandidates: 129 })).toThrow();
  expect(() => createPlanningRuntime({ ...fixture().options, search: { maxCandidates: 0 } })).toThrow();
}, 60000);
test("unsafe/no feasible routes return internal no_feasible_plan with unchanged operations", async () => {
  const run = runFixture();
  for (const observation of run.sourceSnapshot.observations) observation.condition = "impassable";
  const before = JSON.stringify(run), result = await search(run);
  expect(result.search.outcome).toBe("no_feasible_plan"); expect(result.search.selected_key).toBeNull();
  expect(result.plan.status).toBe("blocked"); expect(result.plan.actions).toHaveLength(0);
  expect(JSON.stringify(run)).toBe(before);
}, 60000);
test("changed actual capacity changes selected assignment rather than returning a canned plan", async () => {
  const run = runFixture(), first = await search(run);
  const standard = run.branches.floodops!.operations.orders.find(o => o.order_id === "ord_order3")!;
  standard.demand = standard.demand.map(d => ({ ...d, value: 1000 }));
  const second = await search(run, "job_capacity1");
  expect(second.plan.actions.some(a => a.targets.order_id === standard.order_id)).toBe(false);
  expect(second.search.selected_key).not.toBe(first.search.selected_key);
}, 60000);
test("cancellation, supersession and elapsed deadline stop before publication", async () => {
  const run = runFixture(), { context, options } = fixture(run), limits = searchLimits();
  await expect(runDeterministicPlanner(context, run, "job_cancel01", "plan_search001", options, limits,
    { deadline: Date.now() + 5000, current: async () => false })).rejects.toBeInstanceOf(PlanningSearchStopped);
  await expect(runDeterministicPlanner(context, run, "job_cancel02", "plan_search001", options, limits,
    { deadline: 0, current: async () => true })).rejects.toMatchObject({ reason: "deadline" });
  const controller = new AbortController(); controller.abort();
  await expect(runDeterministicPlanner(context, run, "job_cancel03", "plan_search001", options, limits,
    { deadline: Date.now() + 5000, current: async () => true, signal: controller.signal })).rejects.toMatchObject({ reason: "cancelled" });
}, 60000);

test("completed work is no_change rather than no_feasible_plan; scope bounds disclose truncation", async () => {
  const run = runFixture(), ops = run.branches.floodops!.operations;
  run.branches.floodops!.operations = { ...ops, orders: ops.orders.map(o => ({ ...o, lifecycle: "delivered", driver_id: o.driver_id ?? "drv_moto01", delivered_at_minute: 0 })),
    drivers: ops.drivers.map(d => ({ ...d, ordered_stops: [] })), hubs: ops.hubs.map(h => ({ ...h, available_order_ids: [] })) };
  validateOperations(run.branches.floodops!.operations);
  const result = await search(run);
  expect(result.search.outcome).toBe("no_change"); expect(result.search.evaluated).toBe(0);
  const initial = runFixture(), { context, options } = fixture(initial);
  const bounded = await runDeterministicPlanner(context, initial, "job_scope001", "plan_search001", options,
    searchLimits({ maxDrivers: 1 }), { deadline: Date.now() + 60000, current: async () => true });
  expect(bounded.search.truncated).toBe(true);
}, 60000);
