import type { Coordinate, Graph, Knowledge, OperationalBranch, RoadSegment, Route, VehicleType } from "@floodops/contracts";
import type { PresentationState } from "@floodops/design-tokens";
export function segmentState(segment: RoadSegment, knowledge: Knowledge | null, vehicle: VehicleType, minute: number, current = true): PresentationState {
  const entries = knowledge?.segments.filter(item => item.segment_id === segment.segment_id && item.vehicle_type === vehicle) ?? [];
  if (entries.some(item => item.state === "authoritative_closed")) return { tone: "closed", label: "Authoritative closed" };
  if (entries.length > 1) return { tone: "unknown", label: "Knowledge không nhất quán" };
  const item = entries[0];
  if (item?.state === "authoritative_closed") return { tone: "closed", label: "Authoritative closed" };
  if (!segment.allowed_vehicle_types.includes(vehicle)) return { tone: "blocked", label: "Không hỗ trợ loại xe" };
  if (item?.state === "unresolved_conflict") return { tone: "conflict", label: "Conflict chưa giải quyết" };
  if (!current || !item || item.state === "ordinary_unknown" || (item.expires_sim_minute !== null && item.expires_sim_minute <= minute))
    return { tone: "unknown", label: "Unknown / bằng chứng không còn current" };
  if (item.condition === "impassable") return { tone: "closed", label: "Impassable theo evidence" };
  if (item.condition === "caution") return { tone: "congestion", label: "Caution" };
  return item.condition === "normal" ? { tone: "ready", label: "Known normal theo evidence" } : { tone: "unknown", label: "Unknown" };
}
export interface EntityMarker { id: string; label: string; coordinate: Coordinate | null; detail: string }
export function entityMarkers(graph: Graph, branch: OperationalBranch | null): EntityMarker[] {
  const node = (id: string | null) => graph.nodes.find(item => item.node_id === id)?.coordinate ?? null;
  if (!branch) return [];
  return [
    ...branch.hubs.map(hub => ({ id: hub.hub_id, label: `Hub ${hub.hub_id}`, coordinate: hub.coordinate, detail: `${hub.status}${hub.is_assumed ? " · Assumed" : ""}` })),
    ...branch.drivers.map(driver => ({ id: driver.driver_id, label: `${driver.vehicle_type} ${driver.driver_id}`, coordinate: driver.position.kind === "node" ? node(driver.position.node_id) : null,
      detail: driver.position.kind === "on_edge" ? `Trên đoạn ${driver.position.segment_id}; không có tọa độ điểm` : `Node ${driver.position.node_id} · ${driver.status}` })),
    ...branch.orders.map(order => ({ id: order.order_id, label: `Order ${order.order_id}`, coordinate: node(order.destination_node_id), detail: `${order.tier} · ${order.lifecycle} · destination ${order.destination_node_id}` })),
  ];
}
export function activeRoutes(graph: Graph, branch: OperationalBranch | null, routes: readonly Route[], vehicle: VehicleType) {
  const accepted: Route[] = [], missing: string[] = [];
  for (const routeId of branch?.active_route_ids ?? []) {
    const route = routes.find(item => item.route_id === routeId);
    if (!route || !branch?.drivers.some(driver => driver.driver_id === route.driver_id)) { missing.push(routeId); continue; }
    if (branch.drivers.find(driver => driver.driver_id === route.driver_id)?.vehicle_type !== vehicle) continue;
    if (route.status === "no_route" || route.segment_ids.some(id => !graph.segments.some(segment => segment.segment_id === id))) { missing.push(routeId); continue; }
    accepted.push(route);
  }
  return { accepted, missing };
}
