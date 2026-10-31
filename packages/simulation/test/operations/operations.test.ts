import { expect, test } from "bun:test";
import { applyAssignmentCandidate, assertCapacity, changeLoad, deferOrder, equalLoad, OperationError, validateOperations, zeroLoad } from "@floodops/domain/operations";
import type { OperationState } from "@floodops/domain/operations";
import type { Order, Stop, ScenarioConfig } from "@floodops/contracts";
const data = await Bun.file(new URL("../../../../data/scenarios/functional-v1/manifest.json", import.meta.url)).json() as { initial: OperationState; config: ScenarioConfig };
const initial = () => structuredClone(data.initial);
function errorCode(action: () => unknown): string | null {
  try { action(); return null; } catch (error) { if (error instanceof OperationError) return error.code; throw error; }
}
const service = (_stop: Stop, order: Order) => data.config.parameters.find(p => p.key === `pickup_service:${order.order_id}:${order.pickup_hub_id}`)!.value!;

test("batch validates every transient load, preserves original state and accepts sequential feasible work", () => {
  const state = initial(), before = JSON.stringify(state), first = state.drivers[0]!.ordered_stops, second = state.drivers[1]!.ordered_stops;
  const assignment = [{ order_id: "ord_order2", driver_id: "drv_moto01", pickup_hub_id: null }];
  expect(() => applyAssignmentCandidate(state, { assignments: assignment,
    stopsByDriver: { drv_auto01: [], drv_moto01: [first[0]!, second[0]!, first[1]!, second[1]!] } }, service)).toThrow("Capacity");
  expect(JSON.stringify(state)).toBe(before);
  const valid = applyAssignmentCandidate(state, { assignments: assignment,
    stopsByDriver: { drv_auto01: [], drv_moto01: [...first, ...second] } }, service);
  expect(valid.orders[1]!.driver_id).toBe("drv_moto01"); expect(state.orders[1]!.driver_id).toBe("drv_auto01");
});

test("missing dimensions, mixed units and altered pickup physics fail", () => {
  const state = initial(); state.orders[0]!.demand.pop(); expect(errorCode(() => validateOperations(state))).toBe("UNIT_MISMATCH");
  const mismatch = initial(); mismatch.orders[0]!.demand[0]!.unit = "g"; expect(errorCode(() => validateOperations(mismatch))).toBe("UNIT_MISMATCH");
  const stops = structuredClone(initial().drivers[0]!.ordered_stops); stops[0]!.service_minute = 0;
  expect(() => applyAssignmentCandidate(initial(), { assignments: [], stopsByDriver: { drv_moto01: stops } }, service)).toThrow("frozen physics");
});

test("picked-up retains driver/hub and delivered orders are immutable", () => {
  const state = initial(), order = state.orders[0]!, driver = state.drivers[0]!;
  order.lifecycle = "picked_up"; state.hubs.forEach(hub => { hub.available_order_ids = hub.available_order_ids.filter(id => id !== order.order_id); }); driver.carrying_order_ids = [order.order_id];
  driver.load = driver.capacity.map((item, i) => ({ ...item, value: order.demand[i]!.value })); driver.ordered_stops.shift();
  validateOperations(state);
  expect(() => applyAssignmentCandidate(state, { assignments: [{ order_id: order.order_id, driver_id: "drv_auto01", pickup_hub_id: null }], stopsByDriver: {} }, service)).toThrow("retains");
  order.lifecycle = "delivered"; order.delivered_at_minute = 1; driver.carrying_order_ids = []; driver.load = zeroLoad(driver.capacity); driver.ordered_stops = [];
  validateOperations(state);
  expect(() => applyAssignmentCandidate(state, { assignments: [{ order_id: order.order_id, driver_id: driver.driver_id, pickup_hub_id: null }], stopsByDriver: {} }, service)).toThrow("immutable");
});

test("standard deferral keeps original SLA/tier and enforces configured cumulative limit", () => {
  const state = initial(), deferred = deferOrder(state, "ord_order3", 2, 1, 3);
  expect(deferred.orders[2]!.original_sla_minute).toBe(12); expect(deferred.orders[2]!.cumulative_defer_minute).toBe(2);
  expect(deferred.deferredUntilMinute.ord_order3).toBe(3); expect(state.orders[2]!.cumulative_defer_minute).toBe(0);
  expect(errorCode(() => deferOrder(deferred, "ord_order3", 2, 1, 3))).toBe("POL-06");
  expect(errorCode(() => deferOrder(state, "ord_order1", 1, 0, 3))).toBe("POL-06");
  expect(errorCode(() => deferOrder(state, "ord_order3", 1, 0, null))).toBe("CONFIG_INCOMPLETE");
});

test("decimal quantity operations preserve fractional custody without epsilon capacity bypass", () => {
  const q = (value: number) => [{ dimension: "mass", value, unit: "kg", parameter_key: "mass" }];
  let load = changeLoad(q(0), q(0.1), 1); load = changeLoad(load, q(0.2), 1);
  expect(load[0]!.value).toBe(0.3); expect(() => assertCapacity(load, q(0.3))).not.toThrow();
  load = changeLoad(load, q(0.1), -1); expect(equalLoad(load, q(0.2))).toBe(true);
  expect(changeLoad(load, q(0.2), -1)[0]!.value).toBe(0);
  expect(() => assertCapacity(q(0.30000000000000004), q(0.3))).toThrow("Capacity");
  expect(() => changeLoad(q(1e308), q(0.1), 1)).toThrow("represented");
});

test("unscheduled infeasible demand may remain waiting, but an actual pickup cannot exceed hub/vehicle capacity", () => {
  const state = initial(); state.orders[2]!.demand[0]!.value = 1000;
  expect(() => validateOperations(state)).not.toThrow(); expect(state.orders[2]!.eta_minute).toBeNull();
  const stops = [{ stop_id: "stp_pickup_ord_order3", order_id: "ord_order3", kind: "pickup" as const, node_id: "node_hubAAA", service_minute: 0.25 },
    { stop_id: "stp_deliver_ord_order3", order_id: "ord_order3", kind: "delivery" as const, node_id: "node_destO1", service_minute: 0.5 }];
  expect(() => applyAssignmentCandidate(state, { assignments: [{ order_id: "ord_order3", driver_id: "drv_moto01", pickup_hub_id: null }],
    stopsByDriver: { drv_moto01: [...state.drivers[0]!.ordered_stops, ...stops] } }, service)).toThrow("Capacity");
});
