import { expect, test } from "bun:test";
import { advanceRun, applyKnowledgeTransition, projectCandidate } from "@floodops/simulation";
import { highOnly, motorbikeId, orderId, runFixture } from "../scenario/test-context.ts";

test("runtime normalized report changes shared knowledge without changing committed routes/assignment or frozen dataset", () => {
  const run = advanceRun(runFixture(m => { m.events = m.events.filter(event => event.id !== "evt_bike027"); }), 3, highOnly).run;
  const source = structuredClone(run.sourceSnapshot), original = source.observations.find(item => item.observation_id === "obs_bike001")!;
  original.validation = "superseded";
  source.observations.push({ ...structuredClone(original), observation_id: "obs_runtime001", validation: "accepted" });
  const knowledge = structuredClone(run.knowledge), bike = knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")!;
  Object.assign(bike, { state: "known", condition: "normal", confidence_band: "low", knowledge_epoch: 1, observation_ids: ["obs_runtime001"], expires_sim_minute: 6 });
  const changed = applyKnowledgeTransition(run, knowledge, { sourceSnapshot: source, reasonId: "rpt_runtime001" });
  expect(changed.nowMs).toBe(run.nowMs); expect(changed.branches.floodops!.operations).toEqual(run.branches.floodops!.operations);
  expect(changed.scenario.manifest).toEqual(run.scenario.manifest);
  expect(run.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")!.state).toBe("ordinary_unknown");
  expect(changed.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "car")!.state).toBe("ordinary_unknown");
  const policy = { authorizeEntry: ({ knowledge }: Parameters<typeof highOnly.authorizeEntry>[0]) => ({ allowed: knowledge?.state === "known", reason: "explicit bound approval" }) };
  const driver = run.branches.floodops!.operations.drivers.find(item => item.driver_id === motorbikeId)!;
  const candidate = { assignments: [], stopsByDriver: { [motorbikeId]: driver.ordered_stops } };
  expect(projectCandidate(changed, candidate, policy).etas[orderId]).toBe(5.5);
  expect(changed.branches.floodops!.operations.orders[0]!.eta_minute).toBeNull();
});

test("runtime source port rejects omitted closure, stale epoch and changed source authority", () => {
  const run = advanceRun(runFixture(), 3, highOnly).run;
  const omitted = run.knowledge.filter(item => item.segment_id !== "seg_edge21");
  expect(() => applyKnowledgeTransition(run, omitted, { sourceSnapshot: run.sourceSnapshot, reasonId: "omit" })).toThrow();
  const stale = structuredClone(run.knowledge); stale.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")!.knowledge_epoch = 0;
  expect(() => applyKnowledgeTransition(run, stale, { sourceSnapshot: run.sourceSnapshot, reasonId: "stale" })).toThrow();
  const sources = structuredClone(run.sourceSnapshot); sources.sources[0]!.policy_profile_id = "prf_authority1";
  expect(() => applyKnowledgeTransition(run, run.knowledge, { sourceSnapshot: sources, reasonId: "spoof" })).toThrow("registry");
});

test("a superseded fixture projection cannot overwrite a later runtime acceptance, and source history is immutable", () => {
  const run = advanceRun(runFixture(), 2.5, highOnly).run;
  const source = structuredClone(run.sourceSnapshot), original = source.observations.find(item => item.observation_id === "obs_bike001")!;
  original.validation = "superseded";
  source.observations.push({ ...structuredClone(original), observation_id: "obs_runtime002", validation: "accepted",
    observed_sim_minute: 2.5, observed_at: "2026-10-31T00:02:30Z", expires_sim_minute: 5.5, expires_at: "2026-10-31T00:05:30Z" });
  const knowledge = structuredClone(run.knowledge), bike = knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")!;
  Object.assign(bike, { state: "known", condition: "normal", confidence_band: "low", knowledge_epoch: 1, observation_ids: ["obs_runtime002"], expires_sim_minute: 5.5 });
  const accepted = applyKnowledgeTransition(run, knowledge, { sourceSnapshot: source, reasonId: "rpt_runtime002" });
  const next = advanceRun(accepted, 3, highOnly).run;
  expect(next.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")!.observation_ids).toEqual(["obs_runtime002"]);
  expect(next.log.some(event => event.reason === "STALE_FIXTURE_PROJECTION:evt_bike027")).toBe(true);
  const removed = structuredClone(source); removed.restrictions.pop();
  expect(() => applyKnowledgeTransition(run, knowledge, { sourceSnapshot: removed, reasonId: "remove" })).toThrow("immutable");
});

test("newly effective authoritative closure survives runtime epoch advances while old observations are skipped", () => {
  const run = advanceRun(runFixture(), 0.5, highOnly).run, knowledge = structuredClone(run.knowledge);
  for (const segmentId of ["seg_edge17", "seg_edge27"]) {
    const item = knowledge.find(item => item.segment_id === segmentId && item.vehicle_type === "motorbike")!;
    Object.assign(item, { knowledge_epoch: 2, state: "ordinary_unknown", condition: "unknown", confidence_band: null, observation_ids: [], expires_sim_minute: null });
  }
  const changed = applyKnowledgeTransition(run, knowledge, { sourceSnapshot: run.sourceSnapshot, reasonId: "epoch-update" });
  const end = advanceRun(changed, 3, highOnly).run;
  expect(end.knowledge.find(item => item.segment_id === "seg_edge17" && item.vehicle_type === "motorbike")).toMatchObject({ state: "authoritative_closed", knowledge_epoch: 3 });
  expect(end.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")).toMatchObject({ state: "ordinary_unknown", knowledge_epoch: 2 });
  expect(end.log.some(event => event.reason === "STALE_FIXTURE_PROJECTION:evt_bike027")).toBe(true);
});
