import { expect, test } from "bun:test";
import { advanceRun, applyExecutedCandidate, computeRoute } from "@floodops/simulation";
import { carId, hash, highOnly, runFixture } from "../scenario/test-context.ts";

test("candidate hub override produces actual hub visit, pickup stock and delivery", () => {
  const run = runFixture(m => { m.events = []; }), driver = run.branches.floodops!.operations.drivers.find(d => d.driver_id === carId)!;
  const order = run.branches.floodops!.operations.orders.find(o => o.order_id === "ord_order3")!;
  const stops = [...driver.ordered_stops,
    { stop_id: "stp_pickup_ord_order3", order_id: order.order_id, kind: "pickup" as const, node_id: "node_hubBBB", service_minute: 0.25 },
    { stop_id: "stp_deliver_ord_order3", order_id: order.order_id, kind: "delivery" as const, node_id: order.destination_node_id, service_minute: order.service_minute }];
  const candidate = { assignments: [{ order_id: order.order_id, driver_id: carId, pickup_hub_id: "hub_beta01" }], stopsByDriver: { [carId]: stops } };
  const route = computeRoute(run, candidate, carId, highOnly, { routeId: "rte_newhub01", inputRevision: 0, hash });
  expect(route.segment_ids).toContain("seg_edge36"); expect(route.stops[2]!.node_id).toBe("node_hubBBB");
  expect(run.branches.floodops!.operations.orders[2]!.pickup_hub_id).toBe("hub_alpha1");
  const committed = applyExecutedCandidate(run, candidate, highOnly), end = advanceRun(committed, 20, highOnly).run;
  expect(end.branches.floodops!.operations.orders[2]).toMatchObject({ pickup_hub_id: "hub_beta01", lifecycle: "delivered", delivered_at_minute: 9.75 });
  const wrong = structuredClone(candidate); wrong.stopsByDriver[carId][2]!.node_id = "node_hubAAA";
  expect(() => computeRoute(run, wrong, carId, highOnly, { routeId: "rte_wronghub1", inputRevision: 0, hash })).toThrow("pickup");
});
