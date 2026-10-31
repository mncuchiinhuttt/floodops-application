import { RouteSchema, SegmentKnowledgeSchema } from "@floodops/contracts";
import { quantityMap } from "@floodops/domain/operations";
import type { ScenarioManifest, HashText } from "./scenario-types.ts";
import { scopedParameter } from "./scenario-types.ts";
import { canonicalJson } from "./fingerprint.ts";
import { minutesToMilliseconds } from "../clock/index.ts";

function unique(ids: readonly string[]): void {
  if (new Set(ids).size !== ids.length || ids.some(id => !id.trim())) throw new Error("Duplicate/empty manifest reference.");
}
export function validateManifest(manifest: ScenarioManifest, hash: HashText): void {
  const { config, graph, initial } = manifest;
  unique(config.parameters.map(item => item.key));
  const horizon = config.horizon_minute, nodes = new Set(graph.nodes.map(node => node.node_id));
  if (!manifest.licence.trim() || !manifest.seed.trim() || horizon <= 0) throw new Error("Missing dataset licence/seed/H.");
  if (config.region_boundary[0]!.some((value, axis) => value !== config.region_boundary.at(-1)![axis])) throw new Error("Region polygon must close.");
  if (scopedParameter(config.parameters, "horizon", "minute").value !== horizon) throw new Error("Horizon parameter mismatch.");
  for (const segment of graph.segments) {
    if (!segment.provenance.every(item => item.licence.trim() && item.method.trim() && item.source_hash.trim())) throw new Error("Missing geometry provenance.");
    for (const profile of segment.travel_profiles) {
      if (!profile.parameter_keys.length) throw new Error("Missing travel parameter reference.");
      for (const key of profile.parameter_keys) {
        if (scopedParameter(config.parameters, key, "minute", profile.vehicle_type).value !== profile.travel_time_minute) throw new Error("Travel parameter mismatch.");
      }
    }
  }
  const quantities = [...initial.orders.map(order => order.demand), ...initial.drivers.map(driver => driver.capacity), ...initial.hubs.map(hub => hub.capacity)];
  for (const vector of quantities) for (const item of quantityMap(vector).values()) {
    if (scopedParameter(config.parameters, item.parameter_key, item.unit).value !== item.value) throw new Error("Quantity parameter mismatch.");
  }
  for (const order of initial.orders) {
    if (!nodes.has(order.destination_node_id) || order.original_sla_minute >= horizon
      || scopedParameter(config.parameters, `sla:${order.order_id}`, "minute").value !== order.original_sla_minute
      || scopedParameter(config.parameters, `service:${order.order_id}`, "minute").value !== order.service_minute) throw new Error("Invalid order node/SLA/service parameter.");
  }
  for (const hub of initial.hubs) if (!nodes.has(hub.node_id) || graph.nodes.find(node => node.node_id === hub.node_id)!.coordinate.some((value, axis) => value !== hub.coordinate[axis])) throw new Error("Hub must be an actual graph node.");
  for (const driver of initial.drivers) {
    if (driver.position.kind === "node" && !nodes.has(driver.position.node_id!)) throw new Error("Unknown driver node.");
    if (driver.position.kind === "on_edge") {
      const edge = graph.segments.find(edge => edge.segment_id === driver.position.segment_id);
      if (!edge || !edge.allowed_vehicle_types.includes(driver.vehicle_type) || driver.position.entered_sim_minute! > 0) throw new Error("Invalid initial moving driver.");
    }
    for (const stop of driver.ordered_stops) if (stop.kind === "pickup"
      && scopedParameter(config.parameters, `pickup_service:${stop.order_id}:${initial.orders.find(order => order.order_id === stop.order_id)!.pickup_hub_id}`, "minute").value !== stop.service_minute) throw new Error("Pickup service parameter mismatch.");
  }
  unique(manifest.initialRoutes.map(route => route.route_id)); unique(manifest.initialRoutes.map(route => route.driver_id));
  for (const route of manifest.initialRoutes) {
    RouteSchema.parse(route);
    const driver = initial.drivers.find(driver => driver.driver_id === route.driver_id);
    const origin = driver?.position.node_id ?? graph.segments.find(edge => edge.segment_id === driver?.position.segment_id)?.to_node_id;
    if (!driver || origin !== route.origin_node_id || canonicalJson(driver.ordered_stops) !== canonicalJson(route.stops)
      || route.candidate_context_hash !== hash(canonicalJson(initial)) || route.input_revision !== 0 || route.assignment_overrides.length) throw new Error("Route origin/stops/context/revision mismatch.");
    let node = route.origin_node_id, distance = 0;
    const visits = [node];
    for (const id of route.segment_ids) {
      const edge = graph.segments.find(edge => edge.segment_id === id);
      if (!edge || edge.from_node_id !== node || !edge.allowed_vehicle_types.includes(driver.vehicle_type)) throw new Error("Discontinuous/incompatible route.");
      node = edge.to_node_id; distance += edge.length_m; visits.push(node);
    }
    if (Math.abs(distance - route.distance_m) > 0.000001 || (route.status === "no_route" && (route.segment_ids.length || route.eta_minute !== null))) throw new Error("Invalid route distance/status.");
    if (route.status === "candidate") {
      let cursor = 0;
      for (const stop of route.stops) {
        const index = visits.indexOf(stop.node_id, cursor);
        if (index < 0) throw new Error("Route does not visit actual pickup/destination in order.");
        cursor = index;
      }
    }
  }
  for (const driver of initial.drivers) if (driver.ordered_stops.length && !manifest.initialRoutes.some(route => route.driver_id === driver.driver_id)) throw new Error("Missing scheduled driver route.");
  const pairs = [...config.relevant_scope_pairs, ...manifest.initialKnowledge];
  for (const pair of pairs) {
    const segment = graph.segments.find(edge => edge.segment_id === pair.segment_id);
    if (!segment || !segment.allowed_vehicle_types.includes(pair.vehicle_type)) throw new Error("Unknown relevant/knowledge vehicle pair.");
  }
  unique(config.relevant_scope_pairs.map(pair => JSON.stringify([pair.segment_id, pair.vehicle_type])));
  unique(manifest.initialKnowledge.map(pair => JSON.stringify([pair.segment_id, pair.vehicle_type])));
  manifest.initialKnowledge.forEach(item => SegmentKnowledgeSchema.parse(item));
  const ids = new Map(manifest.events.map(event => [event.id, event]));
  unique(manifest.events.map(event => event.id)); unique(manifest.events.map(event => String(event.sequence)));
  for (const event of manifest.events) {
    if (!Number.isSafeInteger(event.sequence) || event.sequence < 0 || event.atMinute > horizon) throw new Error("Invalid event sequence/horizon.");
    minutesToMilliseconds(event.atMinute);
    if (!["knowledge", "reopening", "context"].includes(event.kind) || (event.kind === "context") !== (event.knowledge === null)) throw new Error("Malformed internal event kind/payload.");
    if (event.knowledge) {
      SegmentKnowledgeSchema.parse(event.knowledge);
      const edge = graph.segments.find(edge => edge.segment_id === event.knowledge!.segment_id);
      if (!edge?.allowed_vehicle_types.includes(event.knowledge.vehicle_type)) throw new Error("Unknown event vehicle/segment.");
    }
    for (const parent of event.afterIds) {
      const cause = ids.get(parent);
      if (!cause || cause.atMinute > event.atMinute || (cause.atMinute === event.atMinute && cause.sequence >= event.sequence)) throw new Error("Invalid event causality.");
    }
  }
  for (const [alias, id] of Object.entries(manifest.aliases)) if (!alias.trim() || !graph.segments.some(edge => edge.segment_id === id)) throw new Error("Invalid scenario alias.");
  for (const hub of initial.hubs) {
    const windows = manifest.hubWindows.filter(window => window.hubId === hub.hub_id).sort((a, b) => a.fromMinute - b.fromMinute);
    if (!windows.length) throw new Error("Explicit anchored hub windows required.");
    for (let i = 0; i < windows.length; i++) {
      const window = windows[i]!; minutesToMilliseconds(window.fromMinute); minutesToMilliseconds(window.untilMinute);
      if (window.untilMinute > horizon || window.untilMinute - window.fromMinute !== hub.capacity_window_minute
        || (i > 0 && windows[i - 1]!.untilMinute > window.fromMinute)
        || canonicalJson(window.capacity) !== canonicalJson(hub.capacity)) throw new Error("Invalid hub capacity window.");
    }
  }
  if (manifest.hubWindows.some(window => !initial.hubs.some(hub => hub.hub_id === window.hubId))) throw new Error("Unknown hub window.");
}
