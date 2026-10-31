import { fail } from "../../shared/index";
import type { SimulationCandidate, SimulationRun } from "@floodops/simulation";
import type { Stop, InternalServiceInput } from "@floodops/contracts";
export function candidateForRoute(run: SimulationRun, input: InternalServiceInput<"compute_route">, id: (value: unknown) => string): SimulationCandidate {
  const ops = run.branches.floodops!.operations, driver = ops.drivers.find(d => d.driver_id === input.driver_id);
  if (!driver || driver.position.kind !== "node" || driver.position.node_id !== input.origin_node_id) fail(422, "UNKNOWN_ENTITY");
  const effective = ops.orders.map(order => {
    const a = input.assignment_overrides.find(a => a.order_id === order.order_id);
    return a ? { ...order, driver_id: a.driver_id, pickup_hub_id: a.pickup_hub_id ?? order.pickup_hub_id } : order;
  });
  const stops: Stop[] = input.stop_refs.map(ref => {
    const order = effective.find(o => o.order_id === ref.order_id), hub = ops.hubs.find(h => h.hub_id === order?.pickup_hub_id);
    if (!order || order.driver_id !== driver.driver_id || !hub) fail(422, "UNKNOWN_ENTITY");
    const parameter = run.scenario.manifest.config.parameters.find(p => p.key === `pickup_service:${order.order_id}:${hub.hub_id}`
      && p.unit === "minute" && p.basis !== "missing");
    if (ref.kind === "pickup" && parameter?.value === null) fail(503, "CONFIG_INCOMPLETE");
    if (ref.kind === "pickup" && !parameter) fail(503, "CONFIG_INCOMPLETE");
    return { stop_id: id([driver.driver_id, ref.order_id, ref.kind]), kind: ref.kind, order_id: order.order_id,
      node_id: ref.kind === "pickup" ? hub.node_id : order.destination_node_id,
      service_minute: ref.kind === "pickup" ? parameter!.value! : order.service_minute };
  });
  const stopsByDriver: Record<string, readonly Stop[]> = { [driver.driver_id]: stops };
  for (const a of input.assignment_overrides) {
    const order = ops.orders.find(o => o.order_id === a.order_id);
    if (!order || !ops.drivers.some(d => d.driver_id === a.driver_id)) fail(422, "UNKNOWN_ENTITY");
    if (order.driver_id && order.driver_id !== a.driver_id && order.driver_id !== input.driver_id) {
      stopsByDriver[order.driver_id] = ops.drivers.find(d => d.driver_id === order.driver_id)!.ordered_stops
        .filter(stop => !input.assignment_overrides.some(change => change.order_id === stop.order_id && change.driver_id !== order.driver_id));
    }
  }
  return { assignments: input.assignment_overrides, stopsByDriver };
}
