import { expect, test } from "bun:test";
import { deriveKnowledgeSnapshot, reconcileEvidence } from "@floodops/domain/knowledge";
import { advanceRun, applyKnowledgeTransition, createRun, loadScenario, sealScenarioDraft } from "@floodops/simulation";
import { hash, highOnly } from "../scenario/test-context.ts";
import { contraryId, contradictory, evidenceContext, scopedManifest, scopes, sharedId, vehicles } from "../scenario/scoped-evidence-context.ts";

for (const contrary of scopes) for (const reversed of [false, true]) test(`runtime public pipeline conflict ${contrary.join("/")}, reversed=${reversed}`, () => {
  const original = scopedManifest(vehicles, [], reversed);
  const run = advanceRun(createRun(loadScenario(sealScenarioDraft(original, hash), hash), "run_scoped001"), 0.1, highOnly).run;
  const incoming = scopedManifest(vehicles, contrary, reversed);
  const knowledge = deriveKnowledgeSnapshot(run.knowledge, evidenceContext(incoming, 0.1));
  const next = applyKnowledgeTransition(run, knowledge, { sourceSnapshot: incoming.sourceSnapshot, reasonId: "rpt_scoped001" });
  for (const vehicle of vehicles) expect(next.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === vehicle)!.state)
    .toBe(contrary.includes(vehicle) ? "unresolved_conflict" : "known");
  expect(run.knowledge.filter(item => item.segment_id === "seg_edge27").every(item => item.state === "known")).toBe(true);
  for (const [id, branch] of Object.entries(run.branches)) {
    expect(next.branches[id as keyof typeof next.branches]!.operations).toEqual(branch.operations);
    for (const driver of branch.operations.drivers) {
      const { needsReroute, ...runtime } = next.branches[id as keyof typeof next.branches]!.runtime[driver.driver_id]!;
      const { needsReroute: _before, ...before } = branch.runtime[driver.driver_id]!; void _before;
      expect(runtime).toEqual(before);
      expect(needsReroute).toBe(id === "reroute_only" && contrary.includes(driver.vehicle_type));
    }
  }
  expect(next.scenario).toEqual(run.scenario); expect(next.nowMs).toBe(run.nowMs);
  expect(next.sourceSnapshot.observations.find(item => item.observation_id === sharedId)!.has_conflict).toBe(true);
});

test("expired exactly at boundary cannot keep a current scope conflicted through its global bit", () => {
  const manifest = scopedManifest(vehicles, ["motorbike"]);
  const run = advanceRun(createRun(loadScenario(sealScenarioDraft(manifest, hash), hash), "run_expiry001"), 3, highOnly).run;
  const knowledge = deriveKnowledgeSnapshot(run.knowledge, { ...evidenceContext(manifest, 3), observations: run.sourceSnapshot.observations });
  const next = applyKnowledgeTransition(run, knowledge, { sourceSnapshot: run.sourceSnapshot, reasonId: "expiry-scoped" });
  expect(next.knowledge.filter(item => item.segment_id === "seg_edge27").map(item => item.state)).toEqual(["known", "known", "known"]);
  expect(next.sourceSnapshot.observations.find(item => item.observation_id === sharedId)!.has_conflict).toBe(true);
});

test("real entry blocks bike conflict while a consistent car scope traverses the same shared edge", () => {
  const manifest = scopedManifest(vehicles, ["motorbike"], false, "seg_edge17");
  const car = manifest.initial.drivers.find(item => item.driver_id === "drv_auto01")!;
  manifest.initial.orders.find(item => item.order_id === "ord_order2")!.driver_id = null;
  const standard = manifest.initial.orders.find(item => item.order_id === "ord_order3")!; standard.driver_id = car.driver_id;
  car.position.node_id = "node_hubAAA";
  car.ordered_stops = [
    { stop_id: "stp_pickup_ord_order3", order_id: standard.order_id, kind: "pickup", node_id: "node_hubAAA", service_minute: 0.25 },
    { stop_id: "stp_deliver_ord_order3", order_id: standard.order_id, kind: "delivery", node_id: "node_destO1", service_minute: standard.service_minute }
  ];
  const route = manifest.initialRoutes.find(item => item.driver_id === car.driver_id)!;
  route.origin_node_id = "node_hubAAA"; route.stops = car.ordered_stops; route.segment_ids = ["seg_edge17", "seg_edge21"];
  const run = advanceRun(createRun(loadScenario(sealScenarioDraft(manifest, hash), hash), "run_entry001"), 0.3, highOnly).run;
  const drivers = run.branches.floodops!.operations.drivers;
  expect(drivers.find(item => item.driver_id === "drv_moto01")!.status).toBe("waiting");
  expect(drivers.find(item => item.driver_id === "drv_auto01")!.position).toMatchObject({ kind: "on_edge", segment_id: "seg_edge17" });
  expect(run.log.some(event => event.branch === "floodops" && event.driverId === "drv_moto01" && event.kind === "entry")).toBe(false);
});

test("active closure still wins over shared scope metadata and contrary reports", () => {
  const manifest = scopedManifest(vehicles, ["motorbike"], false, "seg_edge17");
  const loaded = loadScenario(sealScenarioDraft(manifest, hash), hash);
  const run = advanceRun(createRun(loaded, "run_closure001"), 1, highOnly).run;
  const context = evidenceContext(manifest, 1), knowledge = deriveKnowledgeSnapshot(run.knowledge, context);
  const next = applyKnowledgeTransition(run, knowledge, { sourceSnapshot: run.sourceSnapshot, reasonId: "closure-scoped" });
  expect(next.knowledge.filter(item => item.segment_id === "seg_edge17").every(item => item.state === "authoritative_closed")).toBe(true);
  const forged = structuredClone(knowledge), car = forged.find(item => item.segment_id === "seg_edge17" && item.vehicle_type === "car")!;
  Object.assign(car, { state: "known", condition: "normal", confidence_band: "high", observation_ids: [sharedId], restriction_ids: [], expires_sim_minute: 21 });
  expect(() => applyKnowledgeTransition(run, forged, { sourceSnapshot: run.sourceSnapshot, reasonId: "fake-open" })).toThrow("authoritative closure");
});

test("SourcesMedia reconciles per-vehicle evidence after scoped producer adoption", () => {
  const manifest = scopedManifest(vehicles, ["motorbike"]);
  // Producer adoption removed the legacy global-conflict guard; conflicts stay vehicle-scoped.
  const result = reconcileEvidence(manifest.initialKnowledge, evidenceContext(manifest, 0));
  expect(result.knowledge.find(pair => pair.segment_id === "seg_edge27" && pair.vehicle_type === "motorbike")?.state).toBe("unresolved_conflict");
  expect(result.knowledge.filter(pair => pair.segment_id === "seg_edge27" && pair.vehicle_type !== "motorbike").every(pair => pair.state === "known")).toBe(true);
  expect(result.observations.find(item => item.observation_id === sharedId)?.has_conflict).toBe(true);
  expect(contradictory(manifest).observation_id).toBe(contraryId);
});
