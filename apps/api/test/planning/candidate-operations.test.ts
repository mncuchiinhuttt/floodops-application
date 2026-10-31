import { expect, test } from "bun:test";
import type { CandidateAssignment, PlanAction } from "@floodops/contracts";
import { evaluateCandidate } from "../../../../packages/domain/src/planning/index.ts";
import { authority, car, critical, food, hash, makeAction, makePlan, makeRoute, moto, runFixture, standard, stopsFor } from "./planning-context.ts";
function context() {
  const run = runFixture(), plan = makePlan(), routes = [makeRoute(run)];
  return { run, plan, routes, selectedGroupIds: plan.groups.map(g => g.group_id), authority: authority(run, plan), deferLimitMinute: 3 as number | null, hash };
}
function assignmentCase(orderId = standard, hubId: string | null = null) {
  const input = context(), order = input.run.branches.floodops!.operations.orders.find(o => o.order_id === orderId)!;
  const action = input.plan.actions[0]!;
  action.kind = hubId ? "change_hub" : "reassign";
  action.targets.order_id = orderId; action.targets.driver_id = car; action.targets.hub_id = hubId;
  const assignment: CandidateAssignment = { order_id: orderId, driver_id: car, pickup_hub_id: hubId };
  const stops = [...stopsFor(input.run, food), ...stopsFor(input.run, orderId, hubId ?? order.pickup_hub_id)];
  const route = makeRoute(input.run, car);
  route.stops = stops; route.assignment_overrides = [assignment]; input.routes = [route];
  return input;
}
function deferral(orderId = standard, minutes = 3) {
  const input = context(), action = input.plan.actions[0]!;
  action.kind = "defer"; action.targets = { order_id: orderId, defer_minute: minutes, driver_id: null, route_id: null, hub_id: null };
  input.plan.route_ids = []; input.routes = []; return input;
}
test("new hub changes the actual projected pickup node using simulator physics", () => {
  const input = assignmentCase(standard, "hub_beta01"), before = JSON.stringify(input);
  const result = evaluateCandidate(input); expect(result.status).toBe("ready");
  const order = result.projection!.candidateRun.branches.floodops!.operations.orders.find(o => o.order_id === standard)!;
  expect(order.pickup_hub_id).toBe("hub_beta01"); expect(order.original_sla_minute).toBe(12); expect(order.tier).toBe("standard");
  expect(result.routes[0]!.stops.find(s => s.order_id === standard && s.kind === "pickup")!.node_id).toBe("node_hubBBB");
  expect(result.projection!.etas[standard]).not.toBeNull(); expect(JSON.stringify(input)).toBe(before);
});
test.each(["stock", "closed", "old_pickup", "disabled", "window", "window_capacity"] as const)("hub %s violation blocks the full candidate", violation => {
  const input = assignmentCase(standard, "hub_beta01"), ops = input.run.branches.floodops!.operations;
  const hub = ops.hubs.find(h => h.hub_id === "hub_beta01")!;
  if (violation === "stock") hub.available_order_ids = hub.available_order_ids.filter(id => id !== standard);
  if (violation === "closed") hub.status = "closed";
  if (violation === "old_pickup") input.routes[0]!.stops.find(s => s.order_id === standard && s.kind === "pickup")!.node_id = "node_hubAAA";
  if (violation === "disabled") input.run.scenario.manifest.config.feature_flags.change_pickup_hub = false;
  if (violation === "window") input.run.scenario.manifest.hubWindows = [];
  if (violation === "window_capacity") for (const window of input.run.scenario.manifest.hubWindows) if (window.hubId === hub.hub_id) {
    window.capacity = window.capacity.map(q => ({ ...q, value: 0 }));
  }
  const before = JSON.stringify(input); expect(evaluateCandidate(input).status).toBe("blocked"); expect(JSON.stringify(input)).toBe(before);
});
test("combined transient load overflow blocks rather than applying half of a swap", () => {
  const input = context(), action = input.plan.actions[0]!;
  action.kind = "reassign"; action.targets.order_id = food;
  input.routes[0]!.assignment_overrides = [{ order_id: food, driver_id: moto, pickup_hub_id: null }];
  const criticalStops = stopsFor(input.run, critical), foodStops = stopsFor(input.run, food);
  input.routes[0]!.stops = [criticalStops[0]!, foodStops[0]!, criticalStops[1]!, foodStops[1]!];
  // Old driver's food stops must also be cleared atomically; include that independent route in the same group.
  const clear = makeAction("act_clear001", action.dependency_group_id, car); clear.targets.route_id = "rte_clear001";
  input.plan = makePlan([action, clear]); input.authority = authority(input.run, input.plan);
  const route = makeRoute(input.run, car, undefined, "rte_clear001"); route.stops = []; route.assignment_overrides = input.routes[0]!.assignment_overrides;
  input.routes.push(route); const before = JSON.stringify(input), result = evaluateCandidate(input);
  expect(result.status).toBe("blocked"); expect(result.issues.some(i => i.code === "CAPACITY")).toBe(true); expect(JSON.stringify(input)).toBe(before);
});
test("picked-up custody and delivered reassignment are immutable", () => {
  for (const lifecycle of ["picked_up", "delivered"] as const) {
    const input = assignmentCase(critical), ops = input.run.branches.floodops!.operations, order = ops.orders[0]!, driver = ops.drivers[0]!;
    order.lifecycle = lifecycle;
    if (lifecycle === "picked_up") {
      driver.carrying_order_ids = [critical]; driver.load = structuredClone(order.demand); driver.ordered_stops = [stopsFor(input.run, critical)[1]!];
    } else { order.delivered_at_minute = 0; driver.ordered_stops = []; }
    for (const hub of ops.hubs) hub.available_order_ids = hub.available_order_ids.filter(id => id !== critical);
    expect(evaluateCandidate(input).status).toBe("blocked");
  }
});
test("standard benefit cannot compensate for critical unreachable loss", () => {
  const input = context(), action = input.plan.actions[0]!;
  action.kind = "reassign"; action.targets.order_id = standard;
  input.routes[0]!.stops = stopsFor(input.run, standard);
  input.routes[0]!.assignment_overrides = [{ order_id: standard, driver_id: moto, pickup_hub_id: null }];
  const result = evaluateCandidate(input); expect(result.status).toBe("blocked"); expect(result.issues.some(i => i.rule_id === "POL-05")).toBe(true);
});
test("defer exact cumulative cap succeeds and never moves original SLA/tier", () => {
  const input = deferral(), result = evaluateCandidate(input); expect(result.status).toBe("ready");
  const order = result.projection!.candidateRun.branches.floodops!.operations.orders.find(o => o.order_id === standard)!;
  expect(order.cumulative_defer_minute).toBe(3); expect(order.original_sla_minute).toBe(12); expect(order.tier).toBe("standard");
  expect(input.run.branches.floodops!.operations.orders.find(o => o.order_id === standard)!.cumulative_defer_minute).toBe(0);
});
test.each(["missing", "overflow", "critical", "food", "disabled", "cumulative"] as const)("defer %s is blocked with no mutation", violation => {
  const input = deferral(violation === "critical" ? critical : violation === "food" ? food : standard);
  if (violation === "missing") input.deferLimitMinute = null;
  if (violation === "overflow") input.plan.actions[0]!.targets.defer_minute = 4;
  if (violation === "disabled") input.run.scenario.manifest.config.feature_flags.defer_standard = false;
  if (violation === "cumulative") input.run.branches.floodops!.operations.orders.find(o => o.order_id === standard)!.cumulative_defer_minute = 1;
  const before = JSON.stringify(input); expect(evaluateCandidate(input).status).toBe("blocked"); expect(JSON.stringify(input)).toBe(before);
});
test("kind-specific targets, route revision/origin and assignment context are checked", () => {
  for (const mutation of ["target", "revision", "origin", "context"] as const) {
    const input = context();
    if (mutation === "target") input.plan.actions[0]!.targets.defer_minute = 1;
    if (mutation === "revision") input.routes[0]!.input_revision++;
    if (mutation === "origin") input.routes[0]!.origin_node_id = "node_hubBBB";
    if (mutation === "context") input.routes[0]!.assignment_overrides = [{ order_id: standard, driver_id: moto, pickup_hub_id: null }];
    expect(evaluateCandidate(input).status).toBe("blocked");
  }
});
test("unknown wire tier/SLA overrides cannot enter the compiler", () => {
  const input = context();
  (input.plan.actions[0]!.targets as PlanAction["targets"] & { tier?: string }).tier = "standard";
  expect(evaluateCandidate(input).status).toBe("blocked");
});
