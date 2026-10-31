import { expect, test } from "bun:test";
import { ResultsSchema } from "@floodops/contracts";
import type { SimulationRun } from "@floodops/simulation";
import { projectComparableResults } from "../../src/features/results/pure/index.ts";
import { fixtureRun, logEvent, snapshots } from "./result-fixtures.ts";

const project = (run: SimulationRun, includeReroute = false) => projectComparableResults({
  sessionId: "ses_results001", branches: snapshots(run, includeReroute)
});

test("actual functional simulator projects all branches at H with incomplete calibration", () => {
  const run = fixtureRun(), before = JSON.stringify(run);
  const results = project(run, true);
  expect(ResultsSchema.parse(results)).toEqual(results);
  expect(results).toMatchObject({ label: "Simulation result", horizon_minute: 20,
    observed_until_minute: 20, calibration_status: "incomplete", late_reduction_ratio: 0 });
  expect(results.branches.map(branch => branch.branch_id)).toEqual(["static", "floodops", "reroute_only"]);
  for (const branch of results.branches.slice(0, 2)) expect(branch).toMatchObject({
    completed_at_horizon: true, metrics: { critical_late: 1, total_late: 2, total_delay_minutes: 21,
      unfinished_count: 2, executed_violations: 0 }
  });
  expect(JSON.stringify(run)).toBe(before);
});

test("branch-filtered logs preserve independent completions and attempt counts", () => {
  const run = structuredClone(fixtureRun());
  const order = run.branches.static!.operations.orders[0]!;
  run.log = [
    logEvent("static", "delivery", order.original_sla_minute, { orderId: order.order_id }),
    logEvent("floodops", "delivery", order.original_sla_minute + 1, { orderId: order.order_id }),
    logEvent(null, "delivery", 0, { orderId: order.order_id }),
    logEvent("static", "blocked", 2, { attemptId: "road1", scope: "proposal", category: "road" }),
    logEvent("static", "blocked", 2, { attemptId: "road1", scope: "proposal", category: "road" }),
    logEvent("floodops", "blocked", 2, { attemptId: "road2", scope: "movement", category: "road" }),
    logEvent(null, "blocked", 2, { attemptId: "shared", scope: "movement", category: "road" }),
    logEvent("floodops", "blocked", 2, { attemptId: "capacity", scope: "movement", category: "feasibility" }),
    logEvent("floodops", "reassigned", 3, { orderId: order.order_id, afterIncident: true }),
    logEvent("floodops", "reassigned", 4, { orderId: order.order_id, afterIncident: true }),
    logEvent("floodops", "eta_preview", 4, { orderId: order.order_id }),
    logEvent("floodops", "eta_preview", 5, { orderId: order.order_id }),
    logEvent("floodops", "executed_violation", 5)
  ];
  const [baseline, floodops] = project(run).branches.map(branch => branch.metrics);
  expect(floodops!.total_late).toBe(baseline!.total_late + 1);
  expect(floodops!.total_delay_minutes).toBe(baseline!.total_delay_minutes + 1);
  expect(baseline).toMatchObject({ blocked_route_attempts: 1, blocked_proposal_attempts: 1, blocked_movement_attempts: 0 });
  expect(floodops).toMatchObject({ blocked_route_attempts: 1, blocked_proposal_attempts: 0,
    blocked_movement_attempts: 1, orders_reassigned: 1, updated_eta_previews: 1, executed_violations: 1 });
  expect(project(run).late_reduction_ratio).toBeLessThan(0);
});

test("ETA previews are not deliveries and zero baseline yields an unavailable ratio", () => {
  const run = structuredClone(fixtureRun(0));
  for (const order of run.branches.static!.operations.orders) order.eta_minute = 0;
  for (const order of run.branches.floodops!.operations.orders) order.eta_minute = null;
  const result = project(run);
  expect(result.late_reduction_ratio).toBeNull();
  expect(result.branches[0]).toMatchObject({ completed_at_horizon: false,
    metrics: { total_late: 0, unfinished_count: 3, unreachable_count: 0 } });
  expect(result.branches[1]).toMatchObject({ completed_at_horizon: false,
    metrics: { total_late: 0, unfinished_count: 3, unreachable_count: 3 } });
});

test("partial observation excludes later delivery and preserves eventual H", () => {
  const run = structuredClone(fixtureRun(2));
  const order = run.branches.floodops!.operations.orders[0]!;
  run.log.push(logEvent("floodops", "delivery", 3, { orderId: order.order_id }));
  const result = project(run);
  expect(result).toMatchObject({ observed_until_minute: 2, horizon_minute: 20 });
  expect(result.branches[1]).toMatchObject({ completed_at_horizon: false, metrics: { unfinished_count: 3 } });
});

const mismatches: [string, (run: SimulationRun) => void][] = [
  ["scenario", run => { run.scenario.manifest.config.scenario.scenario_id = "scn_different1"; }],
  ["version", run => { run.scenario.manifest.config.scenario.version = "different"; }],
  ["config", run => { run.scenario.manifest.config.config_hash = "different"; }],
  ["seed hash", run => { run.scenario.manifest.config.seed_hash = "different"; }],
  ["seed", run => { run.scenario.manifest.seed = "different"; }],
  ["graph", run => { run.scenario.manifest.config.graph_hash = "different"; }],
  ["bundle", run => { Object.assign(run.scenario, { bundleHash: "different" }); }],
  ["H", run => { run.scenario.manifest.config.horizon_minute = 21; Object.assign(run.scenario, { horizonMs: 1260000 }); }],
  ["observation", run => { run.nowMs -= 1; }],
  ["run", run => { run.runId = "run_different1"; }],
  ["input cursor", run => { run.inputCursor += 1; }],
  ["knowledge", run => { run.knowledge[0]!.knowledge_epoch += 1; }],
  ["shared log", run => { run.log.push(logEvent(null, "input", 0)); }],
  ["pending advance", run => { run.pendingTargetMs = run.nowMs; }]
];
for (const [name, change] of mismatches) test(`rejects mismatched ${name}`, () => {
  const run = fixtureRun(), changed = structuredClone(run); change(changed);
  expect(() => projectComparableResults({ sessionId: "ses_results001", branches: [
    { branchId: "static", run }, { branchId: "floodops", run: changed }
  ] })).toThrow("not comparable");
});

test("rejects duplicate, missing and unavailable branches", () => {
  const run = fixtureRun(), branches = snapshots(run);
  for (const invalid of [[branches[0]!], [branches[0]!, branches[0]!],
    [...branches, branches[0]!]]) expect(() => projectComparableResults({ sessionId: "ses_results001", branches: invalid })).toThrow();
  const missing = structuredClone(run); delete missing.branches.floodops;
  expect(() => project(missing)).toThrow("unavailable");
});

test("rejects invalid time, modified original SLA, missing cohort and duplicate observed completion", () => {
  for (const now of [-1, NaN, Infinity, 1200001, 0.5]) {
    const run = structuredClone(fixtureRun()); run.nowMs = now;
    expect(() => project(run)).toThrow();
  }
  const badH = structuredClone(fixtureRun()); Object.assign(badH.scenario, { horizonMs: 1 });
  expect(() => project(badH)).toThrow("horizon");
  const changed = structuredClone(fixtureRun()); changed.branches.floodops!.operations.orders[0]!.original_sla_minute++;
  expect(() => project(changed)).toThrow("immutable");
  const missing = structuredClone(fixtureRun());
  const branch = missing.branches.floodops!;
  branch.operations = { ...branch.operations, orders: branch.operations.orders.slice(0, -1) };
  expect(() => project(missing)).toThrow("cohort");
  const duplicate = structuredClone(fixtureRun());
  const delivered = duplicate.log.find(event => event.branch === "floodops" && event.kind === "delivery")!;
  duplicate.log.push({ ...delivered, sequence: duplicate.nextSequence });
  expect(() => project(duplicate)).toThrow("Duplicate observed completion");
});
