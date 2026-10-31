import { expect, test } from "bun:test";
import { evaluateCandidate } from "../../../../packages/domain/src/planning/index.ts";
import { approval, authority, car, critical, food, highOnly, hash, makeAction, makePlan, makeRoute, moto, runFixture } from "./planning-context.ts";
function context() {
  const run = runFixture(), plan = makePlan(), routes = [makeRoute(run)];
  return { run, plan, routes, selectedGroupIds: plan.groups.map(g => g.group_id), authority: authority(run, plan), currentPolicy: highOnly, deferLimitMinute: 3 as number | null, hash };
}
test("canonical functional fixture uses real route/projection and leaves committed state unchanged", () => {
  const input = context(), before = JSON.stringify(input), result = evaluateCandidate(input);
  expect(result.status).toBe("ready"); expect(result.is_projected).toBe(true);
  expect(result.routes[0]!.segment_ids).toEqual(["seg_edge12", "seg_edge33", "seg_edge34"]);
  expect(result.projection!.etas[critical]).toBe(3.75);
  expect(result.projection!.candidateRun.scenario.manifest.datasetKind).toBe("functional_fixture");
  expect(JSON.stringify(input)).toBe(before);
  expect(input.run.branches.floodops!.operations.orders[0]!.eta_minute).toBeNull();
});
test("model segment/ETA/rule/Ready assertions do not grant physical authority", () => {
  const input = context(); input.routes[0]!.segment_ids = ["seg_fake001"]; input.routes[0]!.eta_minute = 0;
  input.plan.actions[0]!.rule_results = [{ rule_id: "POL-01", outcome: "pass", reason: "Model assertion", entity_ids: [] }];
  const result = evaluateCandidate(input);
  expect(result.status).toBe("ready"); expect(result.routes[0]!.segment_ids).not.toContain("seg_fake001");
  expect(result.projection!.etas[critical]).toBe(3.75);
});
test.each(["plan", "job", "generation", "revision"] as const)("stale %s is rejected without projection or mutation", field => {
  const input = context(); if (field === "plan") input.authority.current.latest_plan_id = "pln_newer001";
  if (field === "job") input.authority.current.latest_requested_job_id = "job_newer001";
  if (field === "generation") input.authority.current.generation++; if (field === "revision") input.authority.current.revision++;
  const before = JSON.stringify(input), result = evaluateCandidate(input);
  expect(result.status).toBe("needs_replan"); expect(result.projection).toBeNull(); expect(JSON.stringify(input)).toBe(before);
});
test("authority is field-bound rather than dependent on JSON key insertion order", () => {
  const input = context(), i = input.authority.identity;
  input.authority.identity = { planning_job_id: i.planning_job_id, plan_id: i.plan_id,
    input_revision: i.input_revision, generation: i.generation, session_id: i.session_id };
  expect(evaluateCandidate(input).status).toBe("ready");
});
test("mismatched authority binding fails closed", () => {
  const input = context(); input.authority.identity.plan_id = "pln_other001";
  expect(evaluateCandidate(input).status).toBe("blocked");
});
test("unknown road needs matching approval; approved proposal still does not execute", () => {
  const input = context();
  for (const k of input.run.knowledge) if (k.vehicle_type === "motorbike") {
    k.state = "ordinary_unknown"; k.condition = "unknown"; k.confidence_band = null; k.expires_sim_minute = null; k.observation_ids = [];
  }
  expect(evaluateCandidate(input).status).toBe("pending_approval");
  input.authority.approvals = [approval(input.plan)]; const before = JSON.stringify(input);
  const result = evaluateCandidate(input); expect(result.status).toBe("ready");
  expect(result.routes[0]!.unknown_segment_ids.length).toBeGreaterThan(0); expect(JSON.stringify(input)).toBe(before);
});
test("pending group and its dependent are excluded while independent car group remains valid", () => {
  const input = context(), a = input.plan.actions[0]!;
  const dependent = makeAction("act_depend01", "grp_depend01"); dependent.depends_on_action_ids = [a.action_id];
  const independent = makeAction("act_car0001", "grp_car0001", car); independent.targets.route_id = "rte_car0001";
  input.plan = makePlan([a, dependent, independent]); input.authority = authority(input.run, input.plan);
  input.routes.push(makeRoute(input.run, car, undefined, "rte_car0001")); input.selectedGroupIds = ["grp_depend01", "grp_car0001"];
  for (const k of input.run.knowledge) if (k.vehicle_type === "motorbike") {
    k.state = "ordinary_unknown"; k.condition = "unknown"; k.confidence_band = null; k.expires_sim_minute = null;
  }
  const result = evaluateCandidate(input);
  expect(result.status).toBe("ready"); expect(result.selection!.eligible).toEqual(["grp_car0001"]);
  expect(result.selection!.excluded).toEqual(["grp_depend01", "grp_route001"]);
  expect(result.compiled!.candidate.stopsByDriver[moto]).toBeUndefined();
  expect(result.projection!.etas[critical]).toBeNull(); expect(result.projection!.etas[food]).not.toBeNull();
});
test("closed roads and unresolved conflict cannot be approved away", () => {
  for (const state of ["authoritative_closed", "unresolved_conflict"] as const) {
    const input = context(); input.authority.approvals = [approval(input.plan)];
    for (const k of input.run.knowledge) if (k.vehicle_type === "motorbike") { k.state = state; k.condition = "impassable"; }
    expect(evaluateCandidate(input).status).toBe("blocked");
  }
});
test("expiry at entry blocks an old approval and requires replan", () => {
  const input = context(); input.authority.approvals = [approval(input.plan)];
  for (const k of input.run.knowledge) if (k.vehicle_type === "motorbike") k.expires_sim_minute = 0.25;
  expect(evaluateCandidate(input).status).toBe("needs_replan");
});

test("the original frozen event fixture evaluates through actual shared simulator physics", () => {
  const input = context(); input.run = runFixture(true); input.routes = [makeRoute(input.run)]; input.authority = authority(input.run, input.plan);
  const before = JSON.stringify(input.run), result = evaluateCandidate(input);
  expect(result.status).toBe("ready"); expect(result.projection!.etas[critical]).toBe(3.75);
  expect(result.projection!.candidateRun.scenario.manifest.events.length).toBeGreaterThan(0);
  expect(JSON.stringify(input.run)).toBe(before);
});
