import type { Driver, Stop } from "@floodops/contracts";
import { assertCapacity, changeLoad, zeroLoad, OperationError } from "@floodops/domain/operations";
import type { BranchId, SimulationRun } from "./run-types.ts";
import { appendLog } from "./run-log.ts";
import { millisecondsToMinutes } from "../clock/index.ts";

export function completeStop(run: SimulationRun, branchId: BranchId, driver: Driver, stop: Stop): void {
  const branch = run.branches[branchId]!, orders = branch.operations.orders;
  const order = orders.find(item => item.order_id === stop.order_id)!;
  if (!order || order.driver_id !== driver.driver_id) throw new OperationError("PICKUP_CUSTODY", "Invalid pickup/delivery custody.");
  if (stop.kind === "pickup") {
    const hub = branch.operations.hubs.find(item => item.hub_id === order.pickup_hub_id)!;
    const now = millisecondsToMinutes(run.nowMs);
    const window = run.scenario.manifest.hubWindows.find(window => window.hubId === hub?.hub_id && now >= window.fromMinute && now < window.untilMinute);
    if (!hub || hub.status === "closed" || !hub.available_order_ids.includes(order.order_id)
      || hub.node_id !== stop.node_id || order.lifecycle !== "unpicked" || !window) throw new OperationError("HUB_UNAVAILABLE", "Hub window/stock unavailable.");
    let usage = zeroLoad(window.capacity);
    for (const pickup of run.pickupUsage[branchId] ?? []) if (pickup.hubId === hub.hub_id
      && pickup.atMinute >= window.fromMinute && pickup.atMinute < window.untilMinute) {
      usage = changeLoad(usage, orders.find(item => item.order_id === pickup.orderId)!.demand, 1);
    }
    assertCapacity(changeLoad(usage, order.demand, 1), window.capacity);
    const load = changeLoad(driver.load, order.demand, 1); assertCapacity(load, driver.capacity);
    driver.load = load; driver.carrying_order_ids.push(order.order_id); order.lifecycle = "picked_up";
    for (const stock of branch.operations.hubs) stock.available_order_ids = stock.available_order_ids.filter(id => id !== order.order_id);
    run.pickupUsage[branchId]!.push({ hubId: hub.hub_id, orderId: order.order_id, atMinute: now });
    appendLog(run, branchId, "pickup", { driverId: driver.driver_id, orderId: order.order_id });
  } else {
    if (order.lifecycle !== "picked_up" || !driver.carrying_order_ids.includes(order.order_id)
      || order.destination_node_id !== stop.node_id || stop.service_minute !== order.service_minute) throw new OperationError("PICKUP_CUSTODY", "Invalid pickup/delivery custody.");
    driver.load = changeLoad(driver.load, order.demand, -1);
    driver.carrying_order_ids = driver.carrying_order_ids.filter(id => id !== order.order_id);
    order.lifecycle = "delivered"; order.delivered_at_minute = order.eta_minute = millisecondsToMinutes(run.nowMs);
    appendLog(run, branchId, "delivery", { driverId: driver.driver_id, orderId: order.order_id });
  }
  driver.ordered_stops.shift();
}
