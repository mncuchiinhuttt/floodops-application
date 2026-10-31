import { expect, test } from "bun:test";
import { assessCalibration, loadScenario, sealScenarioDraft } from "@floodops/simulation";
import { findRoute, travelDurationMs, validateTravelProfile } from "../../src/graph/index.ts";
import { fixture, hash, loaded } from "./test-context.ts";

test("frozen canonical scenario is detached, hashed and explicitly uncalibrated", () => {
  const source = fixture(), scenario = loadScenario(source, hash);
  source.initial.orders[0]!.original_sla_minute = 100;
  expect(scenario.manifest.initial.orders[0]!.original_sla_minute).toBe(7);
  expect(Object.isFrozen(scenario.manifest.initial.orders[0])).toBe(true);
  expect(assessCalibration(scenario.manifest).status).toBe("incomplete");
  expect(() => loadScenario(scenario.manifest, hash, { requireCalibrated: true })).toThrow("CALIBRATION_INCOMPLETE");
  const tampered = fixture(); tampered.config.seed_hash = "changed";
  expect(() => loadScenario(tampered, hash)).toThrow("SCENARIO_HASH_MISMATCH");
});

test("loader rejects semantic references, units, causality and geometry even with resealed hashes", () => {
  const changes: ((m: ReturnType<typeof fixture>) => void)[] = [
    m => { m.graph.segments[0]!.from_node_id = "node_missing1"; },
    m => { m.initial.orders[0]!.demand.pop(); },
    m => { m.initial.orders[0]!.demand[0]!.unit = "g"; },
    m => { m.events[0]!.afterIds = [m.events[1]!.id]; },
    m => { m.events[0]!.knowledge!.vehicle_type = "truck"; m.events[0]!.knowledge!.segment_id = "seg_edge12"; },
    m => { m.config.parameters.find(p => p.key === "travel:seg_edge17")!.unit = "seconds"; },
    m => { m.initialRoutes[0]!.segment_ids.reverse(); },
    m => { m.hubWindows[0]!.untilMinute = 19; },
    m => { m.config.region_boundary.pop(); }
  ];
  for (const change of changes) expect(() => loaded(change)).toThrow();
  const manifest = sealScenarioDraft(fixture(), hash); manifest.graph.segments[0]!.length_m += 10;
  // Hash integrity catches tampering before any movement is created.
  expect(() => loadScenario(manifest, hash)).toThrow();
});

test("constant validity windows never interpolate, reject gaps/overlaps/non-FIFO and expire exactly", () => {
  const profile = [{ validFromMs: 0, validUntilMs: 100, durationMs: 20 }, { validFromMs: 100, validUntilMs: 200, durationMs: 40 }];
  expect(travelDurationMs(profile, 99)).toBe(20);
  expect(travelDurationMs(profile, 100)).toBe(40);
  expect(() => travelDurationMs(profile, 200)).toThrow();
  for (const bad of [
    [{ validFromMs: 0, validUntilMs: 100, durationMs: 20 }, { validFromMs: 101, validUntilMs: null, durationMs: 40 }],
    [{ validFromMs: 0, validUntilMs: 100, durationMs: 20 }, { validFromMs: 99, validUntilMs: null, durationMs: 40 }],
    [{ validFromMs: 0, validUntilMs: 100, durationMs: 20 }, { validFromMs: 100, validUntilMs: null, durationMs: 19 }]
  ]) expect(() => validateTravelProfile(bad)).toThrow();
});

test("canonical truck and only_turn retain incoming-edge access", () => {
  const scenario = loaded(m => { m.graph.segments.find(e => e.segment_id === "seg_edge17")!.turn_restrictions = [
    { from_segment_id: "seg_edge17", to_segment_id: "seg_edge35", vehicle_types: ["truck"], kind: "only_turn" }
  ]; });
  const route = findRoute(scenario.routing, { from: "node_nodeBB", to: "node_destO1", incomingEdgeId: "seg_edge17", vehicle: "truck", departureMs: 0 });
  expect(route!.edgeIds[0]).toBe("seg_edge35");
  expect(route!.edgeIds).not.toContain("seg_edge21");
});

test("loader rejects forged initial on-edge speed and status", () => {
  expect(() => loaded(m => {
    const order = m.initial.orders[0]!, driver = m.initial.drivers[0]!;
    order.lifecycle = "picked_up"; m.initial.hubs.forEach(hub => { hub.available_order_ids = hub.available_order_ids.filter(id => id !== order.order_id); }); driver.carrying_order_ids = [order.order_id];
    driver.load = order.demand.map((item, i) => ({ ...driver.capacity[i]!, value: item.value }));
    driver.ordered_stops.shift(); driver.status = "moving";
    driver.position = { kind: "on_edge", node_id: null, segment_id: "seg_edge17", entered_sim_minute: 0, exit_sim_minute: 0.1 };
    m.initialRoutes[0]!.origin_node_id = "node_nodeBB"; m.initialRoutes[0]!.segment_ids = ["seg_edge21"]; m.initialRoutes[0]!.stops = driver.ordered_stops;
  })).toThrow("Initial edge duration");
});

test("simulated source/assumed hub labels cannot be relabelled into calibration", () => {
  const m = fixture(); m.datasetKind = "calibrated_evaluation"; m.config.missing_essential_parameters = [];
  m.calibration.holdoutId = "holdout"; m.calibration.trainingId = "training";
  for (const p of m.config.parameters) {
    p.basis = "measured"; p.sample_size = 10; p.tolerance = 1; p.valid_from = "2026-10-30T00:00:00Z"; p.valid_until = "2026-11-01T00:00:00Z";
    p.provenance.forEach(source => { source.reference_url = "https://example.org/synthetic"; source.source_date = "2026-10-30T00:00:00Z"; });
    m.calibration.results.push({ parameterKey: p.key, observed: p.value!, expected: p.value!, tolerance: 1, sampleId: "holdout", unit: p.unit });
  }
  const assessment = assessCalibration(m);
  expect(assessment.status).toBe("incomplete"); expect(assessment.missing).toContain("real_geometry_provenance");
  expect(assessment.missing).toContain("hub_capacity_evidence");
});

test("source/evidence references and configured resource bounds fail closed", () => {
  expect(() => loaded(m => { m.sourceSnapshot.observations.pop(); })).toThrow();
  expect(() => loaded(m => { m.sourceSnapshot.sources[0]!.policy_profile_id = "prf_missing1"; })).toThrow("source policy");
  expect(() => loadScenario(fixture(), hash, { maxEvents: 1 })).toThrow("SCENARIO_RESOURCE_LIMIT");
});

test("authored known projections cannot contradict, outlive or precede their supporting evidence", () => {
  const changes: ((m: ReturnType<typeof fixture>) => void)[] = [
    m => { m.initialKnowledge[0]!.observation_ids = []; },
    m => { m.sourceSnapshot.observations[0]!.condition = "impassable"; },
    m => { m.sourceSnapshot.observations[0]!.observed_sim_minute = 5; },
    m => { m.sourceSnapshot.observations[0]!.expires_sim_minute = 0.1; },
    m => { m.sourceSnapshot.restrictions[0]!.effective_sim_minute = 8; }
  ];
  for (const change of changes) expect(() => loaded(change)).toThrow();
});

test("an internal reopening label cannot remove closure without an authorized reopening record", () => {
  expect(() => loaded(m => {
    const observation = structuredClone(m.sourceSnapshot.observations[0]!);
    Object.assign(observation, { observation_id: "obs_fakeopen1", segment_id: "seg_edge21", knowledge_epoch: 1,
      observed_sim_minute: 4, expires_sim_minute: 20 });
    m.sourceSnapshot.observations.push(observation);
    m.events.push({ id: "evt_fakeopen1", atMinute: 4, sequence: 99, afterIds: [], kind: "reopening",
      knowledge: { segment_id: "seg_edge21", vehicle_type: "motorbike", knowledge_epoch: 1, condition: "normal", confidence_band: "high", state: "known",
        observation_ids: ["obs_fakeopen1"], restriction_ids: [], expires_sim_minute: 20 }, supersedesRestrictionIds: ["rst_seg_edge21"] });
  })).toThrow("authorized source restriction");
});

test("T0 impassable input is applied before any seeded edge entry", () => {
  expect(() => loaded(m => {
    const order = m.initial.orders[0]!, driver = m.initial.drivers[0]!;
    order.lifecycle = "picked_up"; driver.carrying_order_ids = [order.order_id];
    m.initial.hubs.forEach(hub => { hub.available_order_ids = hub.available_order_ids.filter(id => id !== order.order_id); });
    driver.load = driver.capacity.map((item, i) => ({ ...item, value: order.demand[i]!.value }));
    driver.ordered_stops.shift(); driver.status = "moving";
    driver.position = { kind: "on_edge", node_id: null, segment_id: "seg_edge17", entered_sim_minute: 0, exit_sim_minute: 2 };
    m.initialRoutes[0]!.origin_node_id = "node_nodeBB"; m.initialRoutes[0]!.segment_ids = ["seg_edge21"]; m.initialRoutes[0]!.stops = driver.ordered_stops;
    const observation = structuredClone(m.sourceSnapshot.observations[0]!);
    Object.assign(observation, { observation_id: "obs_impassable0", knowledge_epoch: 1, condition: "impassable" });
    m.sourceSnapshot.observations.push(observation);
    m.events.push({ id: "evt_impassable0", atMinute: 0, sequence: 99, afterIds: [], kind: "knowledge", supersedesRestrictionIds: [],
      knowledge: { ...m.initialKnowledge[0]!, knowledge_epoch: 1, condition: "impassable", observation_ids: ["obs_impassable0"] } });
  })).toThrow("Initial edge entry");
});

test("a selected observation subset cannot hide accepted current conflict or available authority", () => {
  expect(() => loaded(m => {
    const conflict = structuredClone(m.sourceSnapshot.observations[0]!);
    conflict.observation_id = "obs_conflict001"; conflict.condition = "impassable";
    m.sourceSnapshot.observations.push(conflict);
  })).toThrow("consistent current evidence");
  expect(() => loaded(m => {
    m.sourceSnapshot.restrictions[0]!.effective_sim_minute = 0;
    m.sourceSnapshot.inputEvents.find(event => event.restriction_id === m.sourceSnapshot.restrictions[0]!.restriction_id)!.sim_minute = 0;
  })).toThrow("authoritative closure");
  expect(() => loaded(m => {
    const old = structuredClone(m.sourceSnapshot.observations[0]!);
    old.observation_id = "obs_rejected01"; old.condition = "impassable"; old.validation = "rejected";
    m.sourceSnapshot.observations.push(old);
  })).not.toThrow();
});
