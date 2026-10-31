import type { Driver, Hub, Order, Parameter, Quantity, Route, Stop } from "@floodops/contracts";
import { parameter } from "./graph-fixture.ts";
export function functionalOperations() {
  const parameters: Parameter[] = [];
  function quantity(key: string, dimension: string, value: number, unit: string): Quantity {
    parameters.push(parameter(key, value, unit)); return { dimension, value, unit, parameter_key: key };
  }
  const vector = (id: string, kg: number, volume: number) => [quantity(`${id}:mass`, "mass", kg, "kg"), quantity(`${id}:volume`, "volume", volume, "L")];
  const orders: Order[] = [
    { order_id: "ord_order1", tier: "critical", demand: vector("demand:1", 1.5, 2), pickup_hub_id: "hub_alpha1", destination_node_id: "node_destO1", driver_id: "drv_moto01", original_sla_minute: 7, eta_minute: null, service_minute: 0.5, lifecycle: "unpicked", delivered_at_minute: null, cumulative_defer_minute: 0, provenance_label: "simulated" },
    { order_id: "ord_order2", tier: "food", demand: vector("demand:2", 4, 6), pickup_hub_id: "hub_beta01", destination_node_id: "node_destO2", driver_id: "drv_auto01", original_sla_minute: 6, eta_minute: null, service_minute: 0.75, lifecycle: "unpicked", delivered_at_minute: null, cumulative_defer_minute: 0, provenance_label: "simulated" },
    { order_id: "ord_order3", tier: "standard", demand: vector("demand:3", 2, 3), pickup_hub_id: "hub_alpha1", destination_node_id: "node_destO1", driver_id: null, original_sla_minute: 12, eta_minute: null, service_minute: 0.5, lifecycle: "unpicked", delivered_at_minute: null, cumulative_defer_minute: 0, provenance_label: "simulated" }
  ];
  for (const order of orders) parameters.push(parameter(`sla:${order.order_id}`, order.original_sla_minute, "minute"), parameter(`service:${order.order_id}`, order.service_minute, "minute"));
  function stops(order: Order): Stop[] {
    const id = `stp_pickup_${order.order_id}`; parameters.push(parameter(`service:${id}`, 0.25, "minute"));
    return [{ stop_id: id, order_id: order.order_id, kind: "pickup", node_id: order.pickup_hub_id === "hub_alpha1" ? "node_hubAAA" : "node_hubBBB", service_minute: 0.25 },
      { stop_id: `stp_deliver_${order.order_id}`, order_id: order.order_id, kind: "delivery", node_id: order.destination_node_id, service_minute: order.service_minute }];
  }
  for (const order of orders) parameters.push(parameter(`pickup_service:${order.order_id}:${order.pickup_hub_id}`, 0.25, "minute"));
  parameters.push(parameter("pickup_service:ord_order3:hub_beta01", 0.25, "minute"));
  stops(orders[2]!); // Authored service parameter for later standard-order assignment.
  const drivers: Driver[] = [
    { driver_id: "drv_moto01", vehicle_type: "motorbike", capacity: vector("cap:M1", 5, 8), load: [], position: { kind: "node", node_id: "node_hubAAA", segment_id: null, entered_sim_minute: null, exit_sim_minute: null }, status: "idle", carrying_order_ids: [], ordered_stops: stops(orders[0]!) },
    { driver_id: "drv_auto01", vehicle_type: "car", capacity: vector("cap:C1", 10, 20), load: [], position: { kind: "node", node_id: "node_hubBBB", segment_id: null, entered_sim_minute: null, exit_sim_minute: null }, status: "idle", carrying_order_ids: [], ordered_stops: stops(orders[1]!) }
  ];
  for (const driver of drivers) driver.load = driver.capacity.map(item => ({ ...item, value: 0 }));
  const hubs: Hub[] = [
    { hub_id: "hub_alpha1", node_id: "node_hubAAA", coordinate: [106.7, 10.77], status: "open", capacity: vector("hub:A", 30, 60), capacity_window_minute: 20, available_order_ids: ["ord_order1", "ord_order3"], is_assumed: true },
    { hub_id: "hub_beta01", node_id: "node_hubBBB", coordinate: [106.699, 10.771], status: "open", capacity: vector("hub:B", 30, 60), capacity_window_minute: 20, available_order_ids: ["ord_order2", "ord_order3"], is_assumed: true }
  ];
  const initialRoutes: Route[] = drivers.map(driver => ({ route_id: `rte_${driver.driver_id}`, driver_id: driver.driver_id, input_revision: 0,
    segment_ids: driver.driver_id === "drv_moto01" ? ["seg_edge17", "seg_edge21"] : ["seg_edge32", "seg_edge33"], stops: driver.ordered_stops,
    eta_minute: null, evidence_ids: [], unknown_segment_ids: [], status: "candidate", distance_m: 0, candidate_context_hash: "", origin_node_id: driver.position.node_id!, assignment_overrides: [] }));
  return { initial: { orders, drivers, hubs, deferredUntilMinute: {} as Record<string, number> }, initialRoutes, parameters,
    hubWindows: hubs.map(hub => ({ hubId: hub.hub_id, fromMinute: 0, untilMinute: 20, capacity: hub.capacity })) };
}
