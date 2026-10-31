import type { Driver, Order, Hub } from "@floodops/contracts";
import { OperationError, uniqueIds } from "./operation-types.ts";
import { assertCapacity, changeLoad } from "./quantities.ts";

export function validateDriverStops(driver: Driver, orders: readonly Order[], hubs: readonly Hub[]): void {
  uniqueIds(driver.ordered_stops.map(stop => stop.stop_id), "stop IDs");
  const custody = new Set(driver.carrying_order_ids), pickups = new Set<string>(), deliveries = new Set<string>();
  let load = driver.load;
  for (const stop of driver.ordered_stops) {
    const order = orders.find(item => item.order_id === stop.order_id);
    if (!order || order.driver_id !== driver.driver_id || order.lifecycle === "delivered") {
      throw new OperationError("PICKUP_CUSTODY", "Stop must refer to an unfinished order assigned to this driver.");
    }
    if (stop.kind === "pickup") {
      const hub = hubs.find(item => item.hub_id === order.pickup_hub_id);
      if (custody.has(order.order_id) || pickups.has(order.order_id) || !hub || hub.status === "closed"
        || !hub.available_order_ids.includes(order.order_id) || stop.node_id !== hub.node_id) {
        throw new OperationError("PICKUP_CUSTODY", "Invalid pickup hub/availability/custody.");
      }
      assertCapacity(order.demand, hub.capacity);
      custody.add(order.order_id); pickups.add(order.order_id);
      load = changeLoad(load, order.demand, 1);
    } else {
      if (!custody.has(order.order_id) || deliveries.has(order.order_id) || stop.node_id !== order.destination_node_id
        || stop.service_minute !== order.service_minute) throw new OperationError("PICKUP_CUSTODY", "Delivery lacks pickup/correct destination/service.");
      custody.delete(order.order_id); deliveries.add(order.order_id);
      load = changeLoad(load, order.demand, -1);
    }
    assertCapacity(load, driver.capacity);
  }
  for (const orderId of pickups) if (!deliveries.has(orderId)) {
    throw new OperationError("INVALID_STOPS", "A scheduled pickup needs a later delivery.");
  }
}
