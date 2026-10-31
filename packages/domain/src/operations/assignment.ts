import type { Stop, Order } from "@floodops/contracts";
import type { AssignmentCandidate, OperationState } from "./operation-types.ts";
import { cloneOperations, freezeValue, OperationError, uniqueIds } from "./operation-types.ts";
import { validateOperations } from "./validate-operations.ts";

/** Returns an isolated candidate; caller's atomic Execute is the only commit authority. */
export function applyAssignmentCandidate(state: OperationState, candidate: AssignmentCandidate,
  pickupServiceMinute: (stop: Stop, order: Order) => number): OperationState {
  validateOperations(state);
  uniqueIds(candidate.assignments.map(item => item.order_id), "assignment orders");
  const next = cloneOperations(state);
  for (const assignment of candidate.assignments) {
    const order = next.orders.find(item => item.order_id === assignment.order_id);
    const driver = next.drivers.find(item => item.driver_id === assignment.driver_id);
    if (!order || !driver) throw new OperationError("INVALID_REFERENCE", "Unknown assignment order/driver.");
    const hubId = assignment.pickup_hub_id ?? order.pickup_hub_id;
    if (order.lifecycle === "delivered" || (order.lifecycle === "picked_up"
      && (order.driver_id !== driver.driver_id || hubId !== order.pickup_hub_id))) {
      throw new OperationError("PICKUP_CUSTODY", "Delivered is immutable and picked-up retains driver/hub.");
    }
    const hub = next.hubs.find(item => item.hub_id === hubId);
    if (!hub || (order.lifecycle === "unpicked" && (hub.status === "closed" || !hub.available_order_ids.includes(order.order_id)))) {
      throw new OperationError("HUB_UNAVAILABLE", "Candidate pickup hub has no available stock.");
    }
    order.driver_id = driver.driver_id; order.pickup_hub_id = hubId; order.eta_minute = null;
  }
  for (const [driverId, stops] of Object.entries(candidate.stopsByDriver)) {
    const driver = next.drivers.find(item => item.driver_id === driverId);
    if (!driver || driver.position.kind === "on_edge" || driver.status === "servicing") {
      throw new OperationError("DRIVER_BUSY", "Changing a route requires an available node boundary.");
    }
    driver.ordered_stops = structuredClone([...stops]);
  }
  validateOperations(next);
  for (const driver of next.drivers) for (const stop of driver.ordered_stops) {
    if (stop.kind === "pickup" && pickupServiceMinute(stop, next.orders.find(order => order.order_id === stop.order_id)!) !== stop.service_minute) {
      throw new OperationError("CONFIG_INCOMPLETE", "Pickup service differs from frozen physics.");
    }
  }
  return freezeValue(next);
}
export function deferOrder(state: OperationState, orderId: string, minutes: number, now: number, limit: number | null): OperationState {
  if (limit === null || !Number.isFinite(limit) || limit < 0 || !Number.isFinite(minutes) || minutes <= 0
    || !Number.isFinite(now) || now < 0) throw new OperationError("CONFIG_INCOMPLETE", "Explicit valid defer limit/time required.");
  const next = cloneOperations(state), order = next.orders.find(item => item.order_id === orderId);
  if (!order || order.tier !== "standard" || order.lifecycle !== "unpicked"
    || order.cumulative_defer_minute + minutes > limit) throw new OperationError("POL-06", "Only unpicked standard orders within cumulative limit may defer.");
  order.cumulative_defer_minute += minutes;
  const until = Math.max(now, next.deferredUntilMinute[orderId] ?? now) + minutes;
  const result = { ...next, deferredUntilMinute: { ...next.deferredUntilMinute, [orderId]: until } };
  validateOperations(result);
  return freezeValue(result);
}
