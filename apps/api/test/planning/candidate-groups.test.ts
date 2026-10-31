import { expect, test } from "bun:test";
import { advanceRun } from "@floodops/simulation";
import { createPlanningPolicy, evaluateCandidate, evaluateRoadEntry } from "../../../../packages/domain/src/planning/index.ts";
import { approval, authority, car, critical, food, highOnly, hash, makeAction, makePlan, makeRoute, moto, runFixture, standard, stopsFor } from "./planning-context.ts";
function context() {
  const run = runFixture(), plan = makePlan();
  return { run, plan, routes: [makeRoute(run)], selectedGroupIds: plan.groups.map(g => g.group_id),
    authority: authority(run, plan), currentPolicy: highOnly, deferLimitMinute: 3 as number | null, hash };
}
function unknownMotorbike(input: ReturnType<typeof context>) {
  for (const k of input.run.knowledge) if (k.vehicle_type === "motorbike") {
    k.state = "ordinary_unknown"; k.condition = "unknown"; k.confidence_band = null;
    k.expires_sim_minute = null; k.observation_ids = [];
  }
}
test("an intrinsically invalid defer group excludes its dependents while valid independent route remains ready", () => {
  const input = context(), bad = makeAction("act_bad0001", "grp_bad0001");
  bad.kind = "defer"; bad.targets = { order_id: critical, defer_minute: 1, driver_id: null, hub_id: null, route_id: null };
  const dependent = makeAction("act_depend01", "grp_depend01"); dependent.depends_on_action_ids = [bad.action_id];
  const good = makeAction("act_good001", "grp_good001", car); good.targets.route_id = "rte_car0001";
  input.plan = makePlan([bad, dependent, good]); input.authority = authority(input.run, input.plan);
  input.routes.push(makeRoute(input.run, car, undefined, "rte_car0001")); input.selectedGroupIds = ["grp_depend01", "grp_good001"];
  const result = evaluateCandidate(input);
  expect(result.status).toBe("ready"); expect(result.selection!.eligible).toEqual(["grp_good001"]);
  expect(result.selection!.excluded).toEqual(["grp_bad0001", "grp_depend01"]);
  expect(result.issues.some(i => i.rule_id === "POL-06")).toBe(true);
  expect(result.compiled!.deferrals).toEqual([]);
});
test("individually feasible but inconsistent combined groups reject the entire batch", () => {
  const input = context(), first = makeAction("act_defer001", "grp_defer001"), second = makeAction("act_defer002", "grp_defer002");
  for (const action of [first, second]) {
    action.kind = "defer"; action.targets = { order_id: standard, defer_minute: 1, driver_id: null, hub_id: null, route_id: null };
  }
  input.plan = makePlan([first, second]); input.authority = authority(input.run, input.plan); input.routes = [];
  input.selectedGroupIds = input.plan.groups.map(g => g.group_id);
  for (const id of input.selectedGroupIds) expect(evaluateCandidate({ ...input, selectedGroupIds: [id] }).status).toBe("ready");
  const result = evaluateCandidate(input); expect(result.status).toBe("blocked"); expect(result.projection).toBeNull();
});
test("a surviving independent route is recompiled after assignment group exclusion", () => {
  const input = context(), assign = input.plan.actions[0]!;
  assign.kind = "reassign"; assign.targets.order_id = standard;
  const overrides = [{ order_id: standard, driver_id: moto, pickup_hub_id: null }];
  const original = stopsFor(input.run, critical), extra = stopsFor(input.run, standard);
  input.routes[0]!.stops = [original[0]!, extra[0]!, original[1]!, extra[1]!]; input.routes[0]!.assignment_overrides = overrides;
  const independent = makeAction("act_car0001", "grp_car0001", car); independent.targets.route_id = "rte_car0001";
  input.plan = makePlan([assign, independent]); input.authority = authority(input.run, input.plan);
  const route = makeRoute(input.run, car, undefined, "rte_car0001"); route.assignment_overrides = overrides; input.routes.push(route);
  input.selectedGroupIds = input.plan.groups.map(g => g.group_id); unknownMotorbike(input);
  const result = evaluateCandidate(input);
  expect(result.status).toBe("ready"); expect(result.selection!.eligible).toEqual(["grp_car0001"]);
  expect(result.compiled!.candidate.assignments).toEqual([]);
  expect(result.routes[0]!.assignment_overrides).toEqual([]);
  expect(result.projection!.candidateRun.branches.floodops!.operations.orders.find(o => o.order_id === standard)!.driver_id).toBeNull();
});
test("eta_preview alone never compiles replacement stops or an operational route", () => {
  const input = context(); input.plan.actions[0]!.kind = "eta_preview"; input.routes[0]!.stops = [];
  const result = evaluateCandidate(input);
  expect(result.status).toBe("ready"); expect(result.compiled!.candidate).toEqual({ assignments: [], stopsByDriver: {} });
  expect(result.routes).toEqual([]);
});
test("reassign and hub-change actions combine into one consistent assignment", () => {
  const input = context(), assign = makeAction("act_assign01", "grp_combined1", car), hub = makeAction("act_newhub01", "grp_combined1", car);
  assign.kind = "reassign"; assign.targets.order_id = standard;
  hub.kind = "change_hub"; hub.targets.order_id = standard; hub.targets.hub_id = "hub_beta01";
  input.plan = makePlan([assign, hub]); input.authority = authority(input.run, input.plan);
  const route = makeRoute(input.run, car); route.stops = [...stopsFor(input.run, food), ...stopsFor(input.run, standard, "hub_beta01")];
  route.assignment_overrides = [{ order_id: standard, driver_id: car, pickup_hub_id: "hub_beta01" }];
  input.routes = [route]; input.selectedGroupIds = ["grp_combined1"];
  const result = evaluateCandidate(input);
  expect(result.status).toBe("ready"); expect(result.compiled!.candidate.assignments).toEqual(route.assignment_overrides);
  const projected = advanceRun(result.projection!.candidateRun, 20,
    createPlanningPolicy(result.projection!.candidateRun, input.authority, result.compiled!.actionIdsByDriver, input.currentPolicy)).run;
  expect(projected.log.some(log => log.branch === "floodops" && log.kind === "pickup" && log.orderId === standard)).toBe(true);
  const order = projected.branches.floodops!.operations.orders.find(o => o.order_id === standard)!;
  expect(order.pickup_hub_id).toBe("hub_beta01"); expect(order.delivered_at_minute).not.toBeNull();
  expect(input.run.branches.floodops!.operations.orders.find(o => o.order_id === standard)!.driver_id).toBeNull();
});
test("soft approval for deferral is bound to the resulting assigned driver", () => {
  const input = context(), assign = makeAction("act_assign01", "grp_combined1", car), defer = makeAction("act_defer001", "grp_combined1");
  assign.kind = "change_hub"; assign.targets.order_id = standard; assign.targets.hub_id = "hub_beta01";
  defer.kind = "defer"; defer.targets = { order_id: standard, defer_minute: 1, driver_id: null, hub_id: null, route_id: null };
  input.plan = makePlan([assign, defer]); input.authority = authority(input.run, input.plan);
  const route = makeRoute(input.run, car); route.stops = [...stopsFor(input.run, food), ...stopsFor(input.run, standard, "hub_beta01")];
  route.assignment_overrides = [{ order_id: standard, driver_id: car, pickup_hub_id: "hub_beta01" }];
  input.routes = [route]; input.selectedGroupIds = ["grp_combined1"];
  for (const k of input.run.knowledge) if (k.vehicle_type === "car") k.confidence_band = "low";
  input.authority.approvals = [approval(input.plan, assign.action_id)];
  expect(evaluateCandidate(input).status).toBe("pending_approval");
  input.authority.approvals = [...input.authority.approvals, approval(input.plan, defer.action_id)];
  const result = evaluateCandidate(input); expect(result.status).toBe("ready");
  expect(result.compiled!.actionIdsByDriver[car]).toContain(defer.action_id);
});
test("new plan or job at equal revision produces a different derived route identity", () => {
  const input = context(), first = evaluateCandidate(input).routes[0]!.route_id;
  input.plan.plan_id = "pln_newer001"; input.plan.planning_job_id = "job_newer001"; input.authority = authority(input.run, input.plan);
  const second = evaluateCandidate(input).routes[0]!.route_id; expect(second).not.toBe(first);
});
test("exact approval never permits car entry on motorbike-only E12", () => {
  const input = context(), action = input.plan.actions[0]!; action.targets.driver_id = car;
  const driver = input.run.branches.floodops!.operations.drivers.find(d => d.driver_id === car)!;
  driver.position.node_id = "node_hubAAA";
  const route = makeRoute(input.run, car); route.stops = [...driver.ordered_stops]; route.segment_ids = ["seg_edge12", "seg_edge33"];
  input.routes = [route]; input.authority.approvals = [approval(input.plan)];
  for (const k of input.run.knowledge) if (k.vehicle_type === "car" && ["seg_edge17", "seg_edge31"].includes(k.segment_id)) {
    k.condition = "impassable"; k.state = "authoritative_closed";
  }
  // Leave all downstream roads usable. Evidence approval alone would allow unknown E12; graph vehicle access must still block it.
  input.authority.epochs = [...input.authority.epochs, { segment_id: "seg_edge12", vehicle_type: "car", knowledge_epoch: 0 }];
  expect(evaluateRoadEntry({ driver, segmentId: "seg_edge12", atMinute: 0, knowledge: null,
    actionIds: [action.action_id], authority: input.authority }).status).toBe("ready");
  expect(evaluateCandidate(input).status).toBe("blocked");
});
test("exact approval cannot override turns in the actual simulator routing graph", () => {
  const input = context(); input.authority.approvals = [approval(input.plan)];
  input.run.knowledge.find(k => k.segment_id === "seg_edge17" && k.vehicle_type === "motorbike")!.state = "authoritative_closed";
  input.run.scenario = { ...input.run.scenario, routing: { ...input.run.scenario.routing, turnBans: [...input.run.scenario.routing.turnBans,
    ...input.run.scenario.routing.edges.filter(e => e.from === "node_nodeCC").map(e => ({
      incoming: "seg_edge12", outgoing: e.id, vehicles: ["motorbike" as const] }))] } };
  expect(evaluateCandidate(input).status).toBe("blocked");
});

test("assignment override key insertion order is semantically irrelevant", () => {
  const input = context(), action = input.plan.actions[0]!; action.kind = "change_hub";
  action.targets.order_id = standard; action.targets.driver_id = car; action.targets.hub_id = "hub_beta01";
  const route = makeRoute(input.run, car); route.stops = [...stopsFor(input.run, food), ...stopsFor(input.run, standard, "hub_beta01")];
  route.assignment_overrides = [{ driver_id: car, pickup_hub_id: "hub_beta01", order_id: standard }];
  input.routes = [route]; expect(evaluateCandidate(input).status).toBe("ready");
});
