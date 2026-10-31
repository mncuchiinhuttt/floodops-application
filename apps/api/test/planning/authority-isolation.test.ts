import { expect, test } from "bun:test";
import { advanceRun, checkEntry, projectCurrent } from "@floodops/simulation";
import type { SimulationPolicy } from "@floodops/simulation";
import { createCurrentPolicy, createPlanningPolicy, evaluateCandidate } from "@floodops/domain/planning";
import type { CandidateEvaluationInput } from "@floodops/domain/planning";
import { approval, authority, car, critical, highOnly, hash, makeAction, makePlan, makeRoute, moto, runFixture } from "./planning-context.ts";
function unknownContext() {
  const run = runFixture(), plan = makePlan(), route = makeRoute(run);
  for (const k of run.knowledge) if (k.vehicle_type === "motorbike") {
    k.state = "ordinary_unknown"; k.condition = "unknown"; k.confidence_band = null;
    k.observation_ids = []; k.expires_sim_minute = null;
  }
  const auth = authority(run, plan);
  return { run, plan, route, auth, driver: run.branches.floodops!.operations.drivers.find(d => d.driver_id === moto)! };
}
test.each([false, true])("proposal approval/feasibility never leaks to static or reroute branches; pending=%s", allowPending => {
  const { run, plan, auth, driver } = unknownContext(); auth.approvals = allowPending ? [] : [approval(plan)];
  const policy = createPlanningPolicy(run, auth, { [moto]: [plan.actions[0]!.action_id] }, highOnly, allowPending);
  expect(checkEntry(run, "floodops", driver, "seg_edge17", 0, policy).allowed).toBe(true);
  for (const branch of ["static", "reroute_only"] as const) expect(checkEntry(run, branch, driver, "seg_edge17", 0, policy).allowed).toBe(false);
  const advanced = advanceRun(run, 0.5, policy).run;
  expect(advanced.log.some(log => log.kind === "entry" && log.driverId === moto && log.branch === "floodops")).toBe(true);
  for (const branch of ["static", "reroute_only"] as const) {
    expect(advanced.log.some(log => log.kind === "entry" && log.driverId === moto && log.branch === branch)).toBe(false);
    expect(advanced.branches[branch]!.operations.drivers.find(d => d.driver_id === moto)!.status).toBe("waiting");
  }
});
test("explicit committed branch authority survives superseded proposal identity", () => {
  const { run, plan, auth, driver } = unknownContext(); auth.current.latest_plan_id = "pln_newer001";
  const ownStatic: SimulationPolicy = { authorizeEntry(context) {
    return { allowed: context.branch === "static" && context.driver.driver_id === moto
      && context.segmentId === "seg_edge17", reason: "COMMITTED_STATIC_GRANT" };
  } };
  const policy = createPlanningPolicy(run, auth, { [moto]: [plan.actions[0]!.action_id] }, ownStatic);
  expect(checkEntry(run, "static", driver, "seg_edge17", 0, policy)).toEqual({ allowed: true, reason: "COMMITTED_STATIC_GRANT" });
  expect(checkEntry(run, "reroute_only", driver, "seg_edge17", 0, policy).allowed).toBe(false);
  expect(checkEntry(run, "floodops", driver, "seg_edge17", 0, policy)).toEqual({ allowed: false, reason: "STALE_PROPOSAL" });
});
function committedUnknownPolicy(): SimulationPolicy {
  return { authorizeEntry(context) {
    return { allowed: (context.knowledge?.state === "known" && context.knowledge.confidence_band === "high")
      || (context.branch === "floodops" && context.driver.driver_id === moto
        && ["seg_edge17", "seg_edge21"].includes(context.segmentId)),
    reason: "CAPTURED_COMMITTED_ENTRY_AUTHORITY" };
  } };
}
test("approving a new proposal cannot change before projection or hide a critical loss", () => {
  const { run, plan, route, auth } = unknownContext(), currentPolicy = committedUnknownPolicy();
  route.stops = [];
  const input: CandidateEvaluationInput = { run, plan, routes: [route], authority: auth, currentPolicy,
    selectedGroupIds: [plan.groups[0]!.group_id], deferLimitMinute: 3, hash };
  const before = projectCurrent(run, currentPolicy), original = JSON.stringify(run);
  expect(before.etas[critical]).toBe(4.75); expect(before.objective.critical_unreachable).toBe(0);
  for (const approvals of [[], [approval(plan)]]) {
    auth.approvals = approvals; const result = evaluateCandidate(input);
    expect(result.status).toBe("blocked"); expect(result.issues.some(issue => issue.rule_id === "POL-05")).toBe(true);
    expect(result.projection).toBeNull();
    expect(projectCurrent(run, currentPolicy).objective).toEqual(before.objective);
    expect(JSON.stringify(run)).toBe(original);
  }
});
test("unaffected FloodOps driver's committed grant is preserved in the combined candidate", () => {
  const { run } = unknownContext(), action = makeAction("act_car0001", "grp_car0001", car), plan = makePlan([action]);
  const route = makeRoute(run, car), auth = authority(run, plan), currentPolicy = committedUnknownPolicy();
  const result = evaluateCandidate({ run, plan, routes: [route], authority: auth, currentPolicy,
    selectedGroupIds: [plan.groups[0]!.group_id], deferLimitMinute: 3, hash });
  expect(result.status).toBe("ready"); expect(result.projection!.etas[critical]).toBe(4.75);
  expect(result.compiled!.candidate.stopsByDriver[moto]).toBeUndefined();
});
test.each(["expiry", "closure", "impassable", "conflict"] as const)("delegated committed authority retains the %s hard/freshness guard", kind => {
  const run = runFixture(), plan = makePlan(), auth = authority(run, plan), driver = run.branches.static!.operations.drivers[0]!;
  const k = run.knowledge.find(k => k.segment_id === "seg_edge17" && k.vehicle_type === "motorbike")!;
  if (kind === "closure") k.state = "authoritative_closed";
  if (kind === "impassable") k.condition = "impassable";
  if (kind === "conflict") k.state = "unresolved_conflict";
  const port: SimulationPolicy = { authorizeEntry: () => ({ allowed: true, reason: "EXPLICIT_COMMITTED_GRANT" }) };
  const policy = createPlanningPolicy(run, auth, { [moto]: [plan.actions[0]!.action_id] }, port);
  expect(checkEntry(run, "static", driver, k.segment_id, (kind === "expiry" ? 21 : 0) * 60_000, policy).allowed).toBe(false);
});
test("missing committed policy fails closed instead of guessing current authority", () => {
  const { run, plan, route, auth } = unknownContext();
  const input = { run, plan, routes: [route], authority: auth, selectedGroupIds: [plan.groups[0]!.group_id], deferLimitMinute: 3, hash };
  const result = evaluateCandidate(input as unknown as CandidateEvaluationInput);
  expect(result.status).toBe("blocked"); expect(result.issues.some(issue => issue.code === "CONFIG_INCOMPLETE")).toBe(true);
});

test("current policy rejects erased expired evidence before invoking a committed grant", () => {
  const run = runFixture(), driver = run.branches.floodops!.operations.drivers[0]!;
  const original = run.knowledge.find(k => k.segment_id === "seg_edge17" && k.vehicle_type === "motorbike")!;
  let calls = 0;
  const policy = createCurrentPolicy(run, { authorizeEntry() { calls++; return { allowed: true, reason: "COMMITTED" }; } });
  const erased = { ...original, state: "ordinary_unknown" as const, condition: "unknown" as const,
    confidence_band: null, observation_ids: [], expires_sim_minute: null };
  expect(policy.authorizeEntry({ branch: "floodops", driver, segmentId: original.segment_id, atMinute: 21, knowledge: erased }))
    .toEqual({ allowed: false, reason: "EVIDENCE_EXPIRED" });
  expect(calls).toBe(0);
});
test("current policy checks captured epoch independently of proposal metadata", () => {
  const run = runFixture(), driver = run.branches.floodops!.operations.drivers[0]!;
  const original = run.knowledge.find(k => k.segment_id === "seg_edge17" && k.vehicle_type === "motorbike")!;
  const policy = createCurrentPolicy(run, { authorizeEntry: () => ({ allowed: true, reason: "COMMITTED" }) });
  expect(policy.authorizeEntry({ branch: "static", driver, segmentId: original.segment_id, atMinute: 0,
    knowledge: { ...original, knowledge_epoch: original.knowledge_epoch + 1 } })).toEqual({ allowed: false, reason: "STALE_EPOCH" });
});
test("current adapter preserves vehicle scope and requires an explicit real policy", () => {
  const run = runFixture(), driver = run.branches.floodops!.operations.drivers.find(d => d.driver_id === car)!;
  const bike = run.knowledge.find(k => k.segment_id === "seg_edge17" && k.vehicle_type === "motorbike")!;
  expect(createCurrentPolicy(run, highOnly).authorizeEntry({ branch: "static", driver,
    segmentId: bike.segment_id, atMinute: 0, knowledge: bike }).allowed).toBe(false);
  expect(() => createCurrentPolicy(run, undefined as unknown as SimulationPolicy)).toThrow("Explicit committed/current");
});

test("the delegated current port receives detached DTOs and cannot mutate the captured input through its arguments", () => {
  const run = runFixture(), driver = run.branches.floodops!.operations.drivers[0]!;
  const knowledge = run.knowledge.find(k => k.segment_id === "seg_edge17" && k.vehicle_type === "motorbike")!;
  const context = { branch: "static" as const, driver, segmentId: knowledge.segment_id, atMinute: 0, knowledge };
  const original = JSON.stringify(run);
  const policy = createCurrentPolicy(run, { authorizeEntry(input) {
    input.driver.carrying_order_ids.push("ord_other001"); input.knowledge!.observation_ids.push("obs_other001");
    return { allowed: true, reason: "EXPLICIT_COMMITTED_GRANT" };
  } });
  expect(policy.authorizeEntry(context).allowed).toBe(true); expect(JSON.stringify(run)).toBe(original);
});
