import type { Graph, Parameter, Provenance, VehicleType } from "@floodops/contracts";
export const syntheticProvenance: Provenance = Object.freeze({ label: "simulated", reference_url: null, source_date: null,
  licence: "Project-authored synthetic fixture", method: "Original invented coordinates/assumed values for functional checks only.", source_hash: "synthetic-authored-v1" });
export function parameter(key: string, value: number, unit: string, vehicles: VehicleType[] = []): Parameter {
  return { key, value, unit, basis: "assumed", vehicle_types: vehicles, geography: "Synthetic TP.HCM coordinate envelope; no real-road claim",
    valid_from: null, valid_until: null, sample_size: null, tolerance: null, uncertainty: "Functional assumption, not D04 evidence", provenance: [{ ...syntheticProvenance }] };
}
export function functionalGraph(): { graph: Graph; parameters: Parameter[] } {
  const nodes: Graph["nodes"] = [
    { node_id: "node_hubAAA", coordinate: [106.700, 10.770] }, { node_id: "node_nodeBB", coordinate: [106.701, 10.770] },
    { node_id: "node_nodeCC", coordinate: [106.700, 10.771] }, { node_id: "node_destO1", coordinate: [106.702, 10.770] },
    { node_id: "node_hubBBB", coordinate: [106.699, 10.771] }, { node_id: "node_destO2", coordinate: [106.702, 10.771] }
  ];
  const definitions: [string, string, string, number, VehicleType[]][] = [
    ["seg_edge17", "node_hubAAA", "node_nodeBB", 2, ["motorbike", "car", "truck"]],
    ["seg_edge21", "node_nodeBB", "node_destO1", 2, ["motorbike", "car", "truck"]],
    ["seg_edge12", "node_hubAAA", "node_nodeCC", 1, ["motorbike"]], ["seg_edge31", "node_hubAAA", "node_nodeCC", 3, ["car", "truck"]],
    ["seg_edge27", "node_nodeCC", "node_destO1", 1, ["motorbike", "car", "truck"]],
    ["seg_edge32", "node_hubBBB", "node_nodeCC", 1, ["motorbike", "car", "truck"]],
    ["seg_edge33", "node_nodeCC", "node_destO2", 1, ["motorbike", "car", "truck"]],
    ["seg_edge34", "node_destO2", "node_destO1", 1, ["motorbike", "car", "truck"]],
    ["seg_edge35", "node_nodeBB", "node_nodeCC", 1, ["motorbike", "car", "truck"]],
    ["seg_edge36", "node_nodeCC", "node_hubBBB", 2, ["motorbike", "car", "truck"]],
    ["seg_edge37", "node_nodeCC", "node_nodeBB", 2, ["motorbike", "car", "truck"]],
    ["seg_edge38", "node_destO2", "node_nodeCC", 1, ["motorbike", "car", "truck"]]
  ];
  const parameters: Parameter[] = [];
  return { graph: { graph_hash: "", nodes, segments: definitions.map(([id, from, to, time, vehicles]) => {
    const key = `travel:${id}`; parameters.push(parameter(key, time, "minute", vehicles));
    return { segment_id: id, from_node_id: from, to_node_id: to,
      polyline: [nodes.find(node => node.node_id === from)!.coordinate, nodes.find(node => node.node_id === to)!.coordinate],
      length_m: 0, allowed_vehicle_types: vehicles, travel_profiles: vehicles.map(vehicle => ({ vehicle_type: vehicle,
        travel_time_minute: time, valid_from_minute: 0, valid_until_minute: null, parameter_keys: [key] })),
      turn_restrictions: [], provenance: [{ ...syntheticProvenance }] };
  }) }, parameters };
}
