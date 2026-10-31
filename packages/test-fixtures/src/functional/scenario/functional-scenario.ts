import type { ScenarioConfig, SegmentKnowledge } from "@floodops/contracts";
import { functionalGraph, parameter } from "./graph-fixture.ts";
import { syntheticReportAsset } from "./report-fixtures.ts";
import { functionalSources } from "./source-fixtures.ts";
import { functionalOperations } from "./operations-fixture.ts";

/** Draft requires explicit sealScenarioDraft(hash) before runtime loadScenario validation. */
export function createFunctionalScenario() {
  const graphData = functionalGraph(), ops = functionalOperations();
  const initialKnowledge: SegmentKnowledge[] = graphData.graph.segments.flatMap(edge => edge.allowed_vehicle_types.map(vehicle => ({
    segment_id: edge.segment_id, vehicle_type: vehicle, knowledge_epoch: 0,
    condition: edge.segment_id === "seg_edge27" ? "unknown" as const : "normal" as const,
    confidence_band: edge.segment_id === "seg_edge27" ? null : "high" as const,
    state: edge.segment_id === "seg_edge27" ? "ordinary_unknown" as const : "known" as const,
    observation_ids: edge.segment_id === "seg_edge27" ? [] : [`obs_simulated_${edge.segment_id}_${vehicle}`], restriction_ids: [], expires_sim_minute: edge.segment_id === "seg_edge27" ? null : 21
  })));
  const sourceData = functionalSources(graphData.graph, initialKnowledge);
  const config: ScenarioConfig = {
    scenario: { scenario_id: "scn_functional1", version: "1", title: "Synthetic FloodOps functional scenario",
      calibration_status: "incomplete", cause_types: ["combined", "rain", "high_tide"], supports_defer: true, supports_hub_change: true, supports_reroute_only: true },
    t0: "2026-10-31T00:00:00Z", timezone: "Asia/Ho_Chi_Minh",
    region_boundary: [[106.698, 10.769], [106.703, 10.769], [106.703, 10.772], [106.698, 10.772], [106.698, 10.769]],
    horizon_minute: 20, seed_hash: "", config_hash: "", graph_hash: "",
    parameters: [...graphData.parameters, ...ops.parameters, ...sourceData.parameters, parameter("horizon", 20, "minute"), parameter("geometry_tolerance_m", 0.01, "m"), parameter("defer_limit", 3, "minute")],
    missing_essential_parameters: ["real_geometry", "real_travel_service", "real_workload", "ttl_location_evidence", "independent_holdout"],
    relevant_scope_pairs: initialKnowledge.map(item => ({ segment_id: item.segment_id, vehicle_type: item.vehicle_type })),
    policies: [], incident_fixtures: [{ fixture_incident_id: "inc_combined1", cause: "combined", title: "Simulated closures, not historical flooding", road_event_ids: ["evt_close17", "evt_close21"], label: "simulated" }],
    source_fixtures: sourceData.sourceFixtures, fixture_assets: [structuredClone(syntheticReportAsset)], source_policy_profiles: sourceData.profiles, feature_flags: { defer_standard: true, change_pickup_hub: true, reroute_only_baseline: true }
  };
  const closed = (id: string): SegmentKnowledge => ({ segment_id: id, vehicle_type: "motorbike", knowledge_epoch: 1, condition: "impassable", confidence_band: null,
    state: "authoritative_closed", observation_ids: [], restriction_ids: [`rst_${id}`], expires_sim_minute: null });
  return { config, graph: graphData.graph, initial: ops.initial, initialRoutes: ops.initialRoutes, initialKnowledge, sourceSnapshot: sourceData.snapshot,
    events: [
      { id: "evt_close17", atMinute: 1, sequence: 1, afterIds: [], kind: "knowledge" as const, knowledge: closed("seg_edge17"), supersedesRestrictionIds: [] },
      { id: "evt_close21", atMinute: 1, sequence: 2, afterIds: [], kind: "knowledge" as const, knowledge: closed("seg_edge21"), supersedesRestrictionIds: [] },
      ...(["car", "truck"] as const).flatMap((vehicle, index) => [17, 21].map((n, offset) => ({
        id: `evt_close${n}_${vehicle}`, atMinute: 1, sequence: 3 + index * 2 + offset, afterIds: [], kind: "knowledge" as const,
        knowledge: { ...closed(`seg_edge${n}`), vehicle_type: vehicle }, supersedesRestrictionIds: [] }))),
      ...sourceData.snapshot.inputEvents.filter(event => event.role === "context").map((event, index) => ({ id: event.input_event_id, atMinute: event.sim_minute,
        sequence: 10 + index, afterIds: [], kind: "context" as const, knowledge: null, supersedesRestrictionIds: [] })),
      { id: "evt_bike027", atMinute: 3, sequence: 9, afterIds: ["evt_close21"], kind: "knowledge" as const,
        knowledge: { segment_id: "seg_edge27", vehicle_type: "motorbike" as const, knowledge_epoch: 1, condition: "normal" as const, confidence_band: "low" as const,
          state: "known" as const, observation_ids: ["obs_bike001"], restriction_ids: [], expires_sim_minute: 6 }, supersedesRestrictionIds: [] }
    ],
    hubWindows: ops.hubWindows, seed: "functional-seed-v1", datasetKind: "functional_fixture" as const,
    licence: "Original project-authored synthetic fixture; not sourced road/operational data",
    aliases: { E17: "seg_edge17", E21: "seg_edge21", E27: "seg_edge27", E12: "seg_edge12" },
    calibration: { holdoutId: null, trainingId: null, results: [] }
  };
}
