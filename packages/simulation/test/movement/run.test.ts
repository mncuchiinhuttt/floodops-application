import { expect, test } from "bun:test";
import { advanceRun, applyExecutedCandidate, checkEntry, computeRoute, projectCandidate, retryCommittedRoute } from "@floodops/simulation";
import { bikeApproved, carId, hash, highOnly, motorbikeId, orderId, runFixture } from "../scenario/test-context.ts";

const driver = (run: ReturnType<typeof runFixture>, id = motorbikeId) => run.branches.floodops!.operations.drivers.find(driver => driver.driver_id === id)!;
const deliveryCandidate = (run: ReturnType<typeof runFixture>) => ({ assignments: [], stopsByDriver: { [motorbikeId]: driver(run).ordered_stops } });

test("service is not instant; pickup/load changes atomically before locked edge travel", () => {
  let run = runFixture(); run = advanceRun(run, 0.1, highOnly).run;
  expect(driver(run).status).toBe("servicing"); expect(run.branches.floodops!.operations.orders[0]!.lifecycle).toBe("unpicked");
  run = advanceRun(run, 0.25, highOnly).run;
  expect(driver(run).position).toMatchObject({ kind: "on_edge", segment_id: "seg_edge17", entered_sim_minute: 0.25, exit_sim_minute: 2.25 });
  expect(driver(run).carrying_order_ids).toEqual([orderId]); expect(driver(run).load.map(item => item.value)).toEqual([1.5, 2]);
  run = advanceRun(run, 1, highOnly).run;
  expect(driver(run).position.exit_sim_minute).toBe(2.25);
  expect(run.log.some(event => event.kind === "in_progress_at_change" && event.segmentId === "seg_edge17")).toBe(true);
  run = advanceRun(run, 20, highOnly).run;
  expect(driver(run).position).toMatchObject({ kind: "node", node_id: "node_nodeBB" }); expect(driver(run).status).toBe("waiting");
  expect(run.log.filter(event => event.branch === "floodops" && event.driverId === motorbikeId && event.kind === "entry").map(event => event.segmentId)).toEqual(["seg_edge17"]);
  expect(run.branches.reroute_only!.operations.orders[0]!.delivered_at_minute).toBe(5.75);
});

test("closure exactly at entry is applied first even under permissive approval", () => {
  const run = advanceRun(runFixture(m => { m.events[0]!.atMinute = 0.25; m.events[1]!.atMinute = 0.25;
    m.sourceSnapshot.restrictions.forEach(restriction => { restriction.effective_sim_minute = 0.25; });
    m.sourceSnapshot.inputEvents.filter(event => event.role === "restriction").forEach(event => { event.sim_minute = 0.25; }); }), 1,
    { authorizeEntry: () => ({ allowed: true, reason: "explicit test approval" }) }).run;
  expect(driver(run).status).toBe("waiting");
  expect(run.log.some(event => event.branch === "floodops" && event.kind === "entry" && event.segmentId === "seg_edge17")).toBe(false);
});

test("expiry exactly at the next edge yields unknown without current observation and blocks old authority", () => {
  const run = advanceRun(runFixture(m => {
    m.events = []; m.initialRoutes[0]!.segment_ids = ["seg_edge12", "seg_edge27"];
    const k = m.initialKnowledge.find(k => k.segment_id === "seg_edge27" && k.vehicle_type === "motorbike")!;
    Object.assign(k, { state: "known", condition: "normal", confidence_band: "low", observation_ids: ["obs_bike001"], knowledge_epoch: 1, expires_sim_minute: 1.25 });
    const observation = m.sourceSnapshot.observations.find(item => item.observation_id === "obs_bike001")!;
    Object.assign(observation, { observed_sim_minute: 0, observed_at: "2026-10-31T00:00:00Z",
      expires_sim_minute: 1.25, expires_at: "2026-10-31T00:01:15Z", confidence_band: "low" });
  }), 1.25, bikeApproved).run;
  expect(driver(run).status).toBe("waiting"); expect(driver(run).position.node_id).toBe("node_nodeCC");
  const knowledge = run.knowledge.find(k => k.segment_id === "seg_edge27" && k.vehicle_type === "motorbike")!;
  expect(knowledge.observation_ids).toEqual([]); expect(knowledge.state).toBe("ordinary_unknown");
  expect(run.log.some(event => event.branch === "floodops" && event.kind === "entry" && event.segmentId === "seg_edge27")).toBe(false);
  const newlyApproved = { authorizeEntry: () => ({ allowed: true, reason: "fresh bound unknown approval" }) };
  const retry = retryCommittedRoute(run, "floodops", motorbikeId);
  expect(advanceRun(retry, 2, newlyApproved).run.log.some(event => event.branch === "floodops" && event.kind === "entry" && event.segmentId === "seg_edge27")).toBe(true);
});

test("whole/split/resumable advance produce identical traces; pending target is fixed", () => {
  const initial = runFixture(), whole = advanceRun(initial, 20, highOnly).run;
  let split = initial;
  for (const minute of [0.1, 0.25, 1, 2.25, 3, 6, 10, 20]) split = advanceRun(split, minute, highOnly).run;
  expect(split).toEqual(whole);
  let result = advanceRun(initial, 20, highOnly, { maxBoundaries: 1 }), calls = 1;
  expect(() => advanceRun(result.run, 19, highOnly)).toThrow();
  while (!result.complete && calls++ < 100) result = advanceRun(result.run, 20, highOnly, { maxBoundaries: 1 });
  expect(result.complete).toBe(true); expect(result.run).toEqual(whole); expect(initial.nowMs).toBe(0);
  expect(() => advanceRun(initial, 21, highOnly)).toThrow();
});

test("projection is isolated; explicit executed candidate changes only FloodOps and uses same physics", () => {
  const run = advanceRun(runFixture(), 2.25, highOnly).run, before = JSON.stringify(run), candidate = deliveryCandidate(run);
  const projected = projectCandidate(run, candidate, highOnly);
  expect(projected.etas[orderId]).toBe(5.75); expect(JSON.stringify(run)).toBe(before);
  const route = computeRoute(run, candidate, motorbikeId, highOnly, { routeId: "rte_candidate1", inputRevision: 5, hash });
  expect(route.segment_ids).toEqual(["seg_edge35", "seg_edge33", "seg_edge34"]); expect(route.eta_minute).toBe(5.75);
  const committed = applyExecutedCandidate(run, candidate, highOnly);
  expect(committed.branches.static).toEqual(run.branches.static); expect(driver(committed).position).toEqual(driver(run).position);
  expect(advanceRun(committed, 20, highOnly).run.branches.floodops!.operations.orders[0]!.delivered_at_minute).toBe(5.75);
});

test("bike report changes same-time candidate ETA; car doesn't inherit and no change occurs before Execute", () => {
  const without = advanceRun(runFixture(m => { m.events.pop(); }), 3, highOnly).run;
  const withReport = advanceRun(runFixture(), 3, highOnly).run;
  const before = projectCandidate(without, deliveryCandidate(without), bikeApproved), after = projectCandidate(withReport, deliveryCandidate(withReport), bikeApproved);
  expect(before.etas[orderId]).toBe(6.5); expect(after.etas[orderId]).toBe(5.5);
  expect(withReport.branches.floodops!.operations.orders[0]!.eta_minute).toBeNull();
  expect(checkEntry(withReport, "floodops", driver(withReport, carId), "seg_edge27", withReport.nowMs, bikeApproved).allowed).toBe(false);
});

test("pickup duration cannot be shortened or spoofed via a different stop ID", () => {
  const run = runFixture(), stops = structuredClone(driver(run).ordered_stops); stops[0]!.service_minute = 0;
  expect(() => projectCandidate(run, { assignments: [], stopsByDriver: { [motorbikeId]: stops } }, highOnly)).toThrow("frozen physics");
  stops[0]!.stop_id = "stp_other001";
  expect(() => projectCandidate(run, { assignments: [], stopsByDriver: { [motorbikeId]: stops } }, highOnly)).toThrow("frozen physics");
});

test("new approval requires an explicit retry of the already committed waiting route", () => {
  const initial = runFixture(m => { m.events = [];
    const k = m.initialKnowledge.find(k => k.segment_id === "seg_edge17" && k.vehicle_type === "motorbike")!;
    k.confidence_band = "low"; k.expires_sim_minute = 3;
    const observation = m.sourceSnapshot.observations.find(o => o.observation_id === k.observation_ids[0])!;
    observation.confidence_band = "low"; observation.source_id = "src_citizen1"; observation.expires_sim_minute = 3; observation.expires_at = "2026-10-31T00:03:00Z"; });
  const waiting = advanceRun(initial, 1, highOnly).run;
  const approved = { authorizeEntry: () => ({ allowed: true, reason: "bound low approval" }) };
  expect(driver(advanceRun(waiting, 2, approved).run).status).toBe("waiting");
  expect(driver(advanceRun(retryCommittedRoute(waiting, "floodops", motorbikeId), 2, approved).run).status).toBe("moving");
});

test("context measurements preserve unknown datum and never create street passability", () => {
  const run = runFixture(m => { m.events = m.events.filter(event => event.kind === "context"); });
  const advanced = advanceRun(run, 0.1, highOnly).run;
  expect(advanced.knowledge).toEqual(run.knowledge);
  const tide = advanced.scenario.manifest.sourceSnapshot.inputEvents.filter(event => event.measurement?.measurement_type === "tide_height");
  expect(tide.map(event => event.measurement!.datum)).toEqual([null, "synthetic-datum-B"]);
  expect(advanced.log.filter(event => event.kind === "input")).toHaveLength(3);
});

test("objective gate rejects losing a feasible critical route even while adding standard work", () => {
  const run = runFixture(m => { m.events = []; });
  const candidate = { assignments: [], stopsByDriver: { [motorbikeId]: [] } };
  const before = JSON.stringify(run);
  expect(() => applyExecutedCandidate(run, candidate, highOnly)).toThrow("POL-05");
  expect(JSON.stringify(run)).toBe(before);
});

test("a bound authorized reopening can resume the existing route, while the closure stays in history", () => {
  const run = runFixture(m => {
    const observation = structuredClone(m.sourceSnapshot.observations[0]!);
    Object.assign(observation, { observation_id: "obs_reopen21", segment_id: "seg_edge21", knowledge_epoch: 1,
      observed_sim_minute: 4, observed_at: "2026-10-31T00:04:00Z", expires_sim_minute: 20, expires_at: "2026-10-31T00:20:00Z" });
    m.sourceSnapshot.observations.push(observation);
    m.sourceSnapshot.restrictions.push({ restriction_id: "rst_reopen21", segment_id: "seg_edge21", vehicle_types: ["motorbike"], kind: "reopening",
      authority_profile_id: "prf_authority1", effective_sim_minute: 4, supersedes_restriction_id: "rst_seg_edge21", evidence_ids: ["evd_reopen21"] });
    m.sourceSnapshot.inputEvents.push({ input_event_id: "evt_reopen21", source_id: "src_authority1", fixture_event_id: "fxe_reopen21", role: "restriction",
      observed_at: "2026-10-31T00:04:00Z", received_at: "2026-10-31T00:04:00Z", sim_minute: 4, label: "simulated", measurement: null, restriction_id: "rst_reopen21", report_id: null });
    m.config.source_fixtures.push({ fixture_event_id: "fxe_reopen21", source_id: "src_authority1", title: "Authorized synthetic reopening", role: "restriction", scheduled_sim_minute: 4 });
    m.events.push({ id: "evt_reopen21", atMinute: 4, sequence: 99, afterIds: ["evt_close21"], kind: "reopening",
      knowledge: { segment_id: "seg_edge21", vehicle_type: "motorbike", knowledge_epoch: 1, condition: "normal", confidence_band: "high", state: "known",
        observation_ids: ["obs_reopen21"], restriction_ids: [], expires_sim_minute: 20 }, supersedesRestrictionIds: ["rst_seg_edge21"] });
  });
  const end = advanceRun(run, 20, highOnly).run;
  expect(end.branches.floodops!.operations.orders[0]!.delivered_at_minute).toBe(6.5);
  expect(end.scenario.manifest.sourceSnapshot.restrictions.some(item => item.restriction_id === "rst_seg_edge21")).toBe(true);
});
