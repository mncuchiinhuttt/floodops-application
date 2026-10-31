import { advanceRun, applyExecutedCandidate, calculateObservedMetrics, computeRoute, projectCandidate, assessCalibration } from "@floodops/simulation";
import { hash, highOnly, motorbikeId, orderId, runFixture } from "./test-context.ts";
const initial = runFixture();
const atClosure = advanceRun(initial, 2.25, highOnly).run;
const candidate = { assignments: [], stopsByDriver: {
  [motorbikeId]: atClosure.branches.floodops!.operations.drivers.find(driver => driver.driver_id === motorbikeId)!.ordered_stops } };
const route = computeRoute(atClosure, candidate, motorbikeId, highOnly, { routeId: "rte_smoke001", inputRevision: 2, hash });
const projected = projectCandidate(atClosure, candidate, highOnly);
const executed = applyExecutedCandidate(atClosure, candidate, highOnly);
const end = advanceRun(executed, 20, highOnly).run;
const metrics = Object.fromEntries(Object.entries(end.branches).map(([id, branch]) => [id,
  calculateObservedMetrics(branch.operations.orders, end.log.filter(event => event.branch === id), 20)]));
if (route.eta_minute !== 5.75 || projected.etas[orderId] !== 5.75
  || end.branches.floodops!.operations.orders[0]!.delivered_at_minute !== 5.75
  || end.branches.static!.operations.orders[0]!.delivered_at_minute !== null
  || metrics.floodops!.executed_violations !== 0 || initial.nowMs !== 0) throw new Error("Scenario smoke failed.");
console.log(JSON.stringify({ datasetKind: initial.scenario.manifest.datasetKind,
  calibration: assessCalibration(initial.scenario.manifest).status,
  seed: initial.scenario.manifest.seed, bundleHash: initial.scenario.bundleHash,
  seedHash: initial.scenario.manifest.config.seed_hash, configHash: initial.scenario.manifest.config.config_hash,
  graphHash: initial.scenario.manifest.graph.graph_hash,
  route: route.segment_ids, projectedCompletion: projected.etas[orderId],
  actualCompletion: end.branches.floodops!.operations.orders[0]!.delivered_at_minute,
  lockedEdgeAtChange: end.log.filter(event => event.kind === "in_progress_at_change").map(event => ({ branch: event.branch, segment: event.segmentId, at: event.atMinute })),
  metrics, finalMinute: end.nowMs / 60000, originalMinute: initial.nowMs / 60000 }, null, 2));
