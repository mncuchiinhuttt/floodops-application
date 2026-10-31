import type { Graph, InputEvent, Observation, Restriction, SegmentKnowledge, Source, SourcePolicyProfile } from "@floodops/contracts";
import { parameter, syntheticProvenance } from "./graph-fixture.ts";
const timestamp = (minute: number) => `2026-10-31T00:${String(minute).padStart(2, "0")}:00Z`;
export function functionalSources(graph: Graph, knowledge: SegmentKnowledge[]) {
  const profiles: SourcePolicyProfile[] = [
    { policy_profile_id: "prf_seedhigh1", confidence_band: "high", ttl_sim_minute: 21, location_tolerance_m: 10, is_restriction_authority: false, may_reopen_restriction: false, parameter_keys: ["ttl_seed", "location_fixture"] },
    { policy_profile_id: "prf_citizen1", confidence_band: "low", ttl_sim_minute: 3, location_tolerance_m: 10, is_restriction_authority: false, may_reopen_restriction: false, parameter_keys: ["ttl_citizen", "location_fixture"] },
    { policy_profile_id: "prf_authority1", confidence_band: "high", ttl_sim_minute: null, location_tolerance_m: null, is_restriction_authority: true, may_reopen_restriction: true, parameter_keys: [] }
  ];
  const sources: Source[] = [
    { source_id: "src_seedcam1", provider: "Synthetic seed evidence", source_type: "camera", role: "observation", access_status: "available", is_simulated: true, policy_profile_id: "prf_seedhigh1", provenance: syntheticProvenance },
    { source_id: "src_citizen1", provider: "Synthetic community report", source_type: "community", role: "observation", access_status: "available", is_simulated: true, policy_profile_id: "prf_citizen1", provenance: syntheticProvenance },
    { source_id: "src_authority1", provider: "Synthetic configured closure authority", source_type: "authority", role: "restriction", access_status: "available", is_simulated: true, policy_profile_id: "prf_authority1", provenance: syntheticProvenance },
    { source_id: "src_rain001", provider: "Synthetic rainfall context", source_type: "weather", role: "context", access_status: "available", is_simulated: true, policy_profile_id: null, provenance: syntheticProvenance },
    { source_id: "src_tide001", provider: "Synthetic tide context", source_type: "tide", role: "context", access_status: "available", is_simulated: true, policy_profile_id: null, provenance: syntheticProvenance }
  ];
  const observations: Observation[] = knowledge.filter(item => item.state === "known").map(item => ({
    observation_id: item.observation_ids[0]!, source_id: "src_seedcam1", segment_id: item.segment_id, knowledge_epoch: 0,
    vehicle_types: [item.vehicle_type], condition: "normal", validation: "accepted", confidence_band: "high", observed_at: timestamp(0),
    observed_sim_minute: 0, expires_at: timestamp(21), expires_sim_minute: 21, evidence_ids: ["evd_seed001"], has_conflict: false
  }));
  observations.push({ observation_id: "obs_bike001", source_id: "src_citizen1", segment_id: "seg_edge27", knowledge_epoch: 1,
    vehicle_types: ["motorbike"], condition: "normal", validation: "accepted", confidence_band: "low", observed_at: timestamp(3), observed_sim_minute: 3,
    expires_at: timestamp(6), expires_sim_minute: 6, evidence_ids: ["rpt_bike001"], has_conflict: false });
  const restrictions: Restriction[] = [17, 21].map(n => ({ restriction_id: `rst_seg_edge${n}`, segment_id: `seg_edge${n}`,
    vehicle_types: [...graph.segments.find(edge => edge.segment_id === `seg_edge${n}`)!.allowed_vehicle_types], kind: "closure", authority_profile_id: "prf_authority1",
    effective_sim_minute: 1, supersedes_restriction_id: null, evidence_ids: ["evd_closure1"] }));
  const inputEvents: InputEvent[] = [17, 21].map(n => ({ input_event_id: `evt_close${n}`, source_id: "src_authority1", fixture_event_id: `fxe_close${n}`,
    role: "restriction", observed_at: timestamp(1), received_at: timestamp(1), sim_minute: 1, label: "simulated", measurement: null, restriction_id: `rst_seg_edge${n}`, report_id: null }));
  inputEvents.push({ input_event_id: "evt_bike027", source_id: "src_citizen1", fixture_event_id: "fxe_bike027", role: "observation", observed_at: timestamp(3), received_at: timestamp(3), sim_minute: 3, label: "simulated", measurement: null, restriction_id: null, report_id: "rpt_bike001" });
  for (const [id, type, value, unit, datum] of [["rain001", "rain", 30, "mm", null], ["tide001", "tide_height", 1.2, "m", null], ["tide002", "tide_height", 1.3, "m", "synthetic-datum-B"]] as const) {
    inputEvents.push({ input_event_id: `evt_${id}`, source_id: type === "rain" ? "src_rain001" : "src_tide001", fixture_event_id: `fxe_${id}`, role: "context",
      observed_at: timestamp(0), received_at: timestamp(0), sim_minute: 0, label: "simulated", restriction_id: null, report_id: null,
      measurement: { measurement_type: type, value, unit, datum, coordinate: [106.7, 10.77], station_id: "synthetic-station", is_forecast: false,
        issued_at: timestamp(0), observed_at: timestamp(0), valid_at: timestamp(0) } });
  }
  return { snapshot: { sources, inputEvents, observations, restrictions }, profiles,
    sourceFixtures: inputEvents.map(event => ({ fixture_event_id: event.fixture_event_id, source_id: event.source_id, title: `Simulated ${event.input_event_id}`, role: event.role, scheduled_sim_minute: event.sim_minute })),
    parameters: [parameter("ttl_seed", 21, "minute"), parameter("ttl_citizen", 3, "minute"), parameter("location_fixture", 10, "m")] };
}
