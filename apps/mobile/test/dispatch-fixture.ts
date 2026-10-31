import type { Graph, Knowledge, SessionSnapshot, Source } from "@floodops/contracts";
import { fixtureResults, fixtureSession } from "../preview/fixture-data";
export const provenance = { label: "simulated" as const, reference_url: null, source_date: null, licence: "Synthetic test fixture", method: "Deterministic UI fixture", source_hash: "fixture-only" };
export const graph: Graph = { graph_hash: "fixture-graph", nodes: [{ node_id: "nod_fixture01", coordinate: [106.7, 10.7] }, { node_id: "nod_fixture02", coordinate: [106.701, 10.701] }],
  segments: [{ segment_id: "seg_fixture01", from_node_id: "nod_fixture01", to_node_id: "nod_fixture02", polyline: [[106.7, 10.7], [106.701, 10.701]], length_m: 160,
    allowed_vehicle_types: ["motorbike", "car"], travel_profiles: [{ vehicle_type: "motorbike", travel_time_minute: 1, valid_from_minute: 0, valid_until_minute: null, parameter_keys: [] }], turn_restrictions: [], provenance: [provenance] }] };
export const knowledge: Knowledge = { segments: [{ segment_id: "seg_fixture01", vehicle_type: "motorbike", knowledge_epoch: 1, condition: "unknown", confidence_band: null,
  state: "unresolved_conflict", observation_ids: [], restriction_ids: [], expires_sim_minute: null }], observations: [], restrictions: [], coverage: { covered_pairs: 0, relevant_pairs: 2, ratio: 0 } };
export const sources: Source[] = [{ source_id: "src_fixture01", provider: "Synthetic rain context", source_type: "weather", role: "context", access_status: "available", is_simulated: true, policy_profile_id: null, provenance }];
export function snapshotFixture(): SessionSnapshot {
  return { session: { ...fixtureSession }, scenario: { scenario_id: fixtureSession.scenario_id, version: "fixture-v1", title: "Synthetic UI scenario", calibration_status: "incomplete",
    cause_types: ["rain"], supports_defer: false, supports_hub_change: false, supports_reroute_only: false }, clock: { now_minute: 10, horizon_minute: 60, advance_job: null, mode: "paused", playback_controls_are_view_only: true },
    knowledge, operations: { branches: [{ branch_id: "static", drivers: [], hubs: [], orders: [], active_route_ids: [] }, { branch_id: "floodops", drivers: [], hubs: [], orders: [], active_route_ids: [] }] },
    impact: { incident_ids: ["inc_fixture01"], affected_orders: [], affected_driver_ids: [], priority_order_ids: [] }, latest_plan: null, active_job: null, results: fixtureResults(), graph_hash: graph.graph_hash };
}
