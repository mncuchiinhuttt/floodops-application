import { DriverSchema, HubSchema, OrderSchema } from "@floodops/contracts";
import type { OperationState } from "./operation-types.ts";
import { OperationError, uniqueIds } from "./operation-types.ts";
import { assertCapacity, changeLoad, equalLoad, quantityMap, zeroLoad } from "./quantities.ts";
import { validateDriverStops } from "./validate-stops.ts";

export function validateOperations(state: OperationState): void {
  state.orders.forEach(order => OrderSchema.parse(order));
  state.drivers.forEach(driver => DriverSchema.parse(driver));
  state.hubs.forEach(hub => HubSchema.parse(hub));
  uniqueIds(state.orders.map(order => order.order_id), "orders");
  uniqueIds(state.drivers.map(driver => driver.driver_id), "drivers");
  uniqueIds(state.hubs.map(hub => hub.hub_id), "hubs");
  uniqueIds(state.drivers.flatMap(driver => driver.ordered_stops.map(stop => stop.stop_id)), "global stops");
  for (const hub of state.hubs) {
    quantityMap(hub.capacity); uniqueIds(hub.available_order_ids, "hub stock");
    if (hub.available_order_ids.some(id => !state.orders.some(order => order.order_id === id && order.lifecycle === "unpicked"))) throw new OperationError("INVALID_REFERENCE", "Unknown stocked order.");
  }
  const carried = new Set<string>();
  for (const driver of state.drivers) {
    assertCapacity(driver.load, driver.capacity);
    uniqueIds(driver.carrying_order_ids, "carrying orders");
    let expected = zeroLoad(driver.capacity);
    for (const id of driver.carrying_order_ids) {
      const order = state.orders.find(order => order.order_id === id);
      if (carried.has(id) || !order || order.driver_id !== driver.driver_id || order.lifecycle !== "picked_up") {
        throw new OperationError("PICKUP_CUSTODY", "Carrying order must have exactly one matching driver.");
      }
      carried.add(id); expected = changeLoad(expected, order.demand, 1);
    }
    if (!equalLoad(expected, driver.load)) throw new OperationError("PICKUP_CUSTODY", "Load differs from actual carried demand.");
    const position = driver.position;
    if (position.kind === "node" ? (!position.node_id || position.segment_id !== null
      || position.entered_sim_minute !== null || position.exit_sim_minute !== null)
      : (position.node_id !== null || !position.segment_id || position.entered_sim_minute === null
        || position.exit_sim_minute === null || position.exit_sim_minute <= position.entered_sim_minute)) {
      throw new OperationError("INVALID_POSITION", "Malformed node/on-edge position.");
    }
    validateDriverStops(driver, state.orders, state.hubs);
  }
  for (const order of state.orders) {
    quantityMap(order.demand);
    if (!state.hubs.some(hub => hub.hub_id === order.pickup_hub_id)
      || (order.driver_id !== null && !state.drivers.some(driver => driver.driver_id === order.driver_id))) {
      throw new OperationError("INVALID_REFERENCE", "Unknown order hub/driver.");
    }
    assertCapacity(order.demand.map(item => ({ ...item, value: 0 })), state.hubs.find(hub => hub.hub_id === order.pickup_hub_id)!.capacity);
    if ((order.lifecycle === "picked_up") !== carried.has(order.order_id)
      || (order.lifecycle === "delivered") !== (order.delivered_at_minute !== null)
      || (order.lifecycle !== "unpicked" && order.driver_id === null)) {
      throw new OperationError("PICKUP_CUSTODY", "Order lifecycle/completion/custody mismatch.");
    }
  }
  for (const [orderId, until] of Object.entries(state.deferredUntilMinute)) {
    if (!state.orders.some(order => order.order_id === orderId) || !Number.isFinite(until) || until < 0) {
      throw new OperationError("INVALID_DEFERRAL", "Invalid deferred order/time.");
    }
  }
}
