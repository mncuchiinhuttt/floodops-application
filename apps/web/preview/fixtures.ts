/** Synthetic fixture-only data. No connected backend, capability, model call or calibration evidence. */
import { ContributorDashboardSchema, DriverDashboardSchema, IdentitySchema, ImageReviewStateSchema, ReportSchema, RouteSchema, SessionMetaSchema, type Role } from "@floodops/contracts";

export const session = SessionMetaSchema.parse({ session_id: "session_fixture001", generation: 1, revision: 4, event_sequence: 8,
  scenario_id: "scenario_fixture001", scenario_version: "fixture-v1", sim_minute: 12, horizon_minute: 120, status: "active",
  calibration_status: "incomplete", created_at: "2026-10-31T00:00:00Z", expires_at: "2099-01-01T00:00:00Z" });
export const now = Date.parse("2026-10-31T01:00:00Z");
export function identity(role: Role) {
  const permissions = role === "driver" ? ["driver:self:read", "reports:submit"] : role === "contributor" ? ["contributor:self:read", "reports:submit"] :
    ["operations:read", "reports:review", "planning:decide", "planning:execute", "results:read"];
  return IdentitySchema.parse({ participant: { participant_id: `participant_${role}001`, role, bound_entity_id: role === "dispatcher" ? null : `${role}_entity001`,
    expires_at: session.expires_at, permissions, is_owner: false }, session, csrf_token: null });
}
export const report = ReportSchema.parse({ report_id: "report_fixture001", participant_id: "participant_contributor001", kind: "citizen", segment_id: "segment_E270001", coordinate: null,
  captured_at: "2026-10-31T00:10:00Z", captured_sim_minute: 10, received_at: "2026-10-31T00:12:00Z", vehicle_types: ["motorbike"],
  description: "Synthetic fixture: nước che một phần mặt đường.", media_id: null, fixture_photo_id: "photo_fixture001", status: "pending_review", reason_codes: [],
  observation_ids: [], award_id: null, input_revision: 4, observation_candidates: [], input_mode: "photo", quick_condition: null, reporter_entity_id: "contributor_entity001" });
export const driverDashboard = DriverDashboardSchema.parse({ driver_id: "driver_entity001", session,
  driver: { driver_id: "driver_entity001", vehicle_type: "motorbike", capacity: [{ dimension: "parcels", value: 8, unit: "count", parameter_key: "fixture-parcels" }], load: [{ dimension: "parcels", value: 0, unit: "count", parameter_key: "fixture-parcels" }],
    position: { kind: "node", node_id: "node_fixture001", segment_id: null, entered_sim_minute: null, exit_sim_minute: null }, status: "waiting", carrying_order_ids: [],
    ordered_stops: [{ stop_id: "stop_fixture001", order_id: "order_fixture001", kind: "pickup", node_id: "node_fixture001", service_minute: 2 }] },
  assigned_orders: [{ order_id: "order_fixture001", tier: "critical", demand: [{ dimension: "parcels", value: 1, unit: "count", parameter_key: "fixture-parcels" }], pickup_hub_id: "hub_fixture001", destination_node_id: "node_fixture002",
    driver_id: "driver_entity001", original_sla_minute: 40, eta_minute: null, service_minute: 2, lifecycle: "unpicked", delivered_at_minute: null,
    cumulative_defer_minute: 0, provenance_label: "simulated" }], route_ids: ["route_fixture001"], own_reports: [] });
export const contributorDashboard = ContributorDashboardSchema.parse({ contributor_id: "contributor_entity001", session,
  own_reports: [{ ...report, status: "accepted" }], awards: [], points_total: 0, coverage: { covered_pairs: 0, relevant_pairs: 1, ratio: 0 } });
export const imageBinding = { sessionId: session.session_id, generation: 1, reportId: report.report_id, jobId: "job_fixture001", inputDigest: "a".repeat(64), reportInputRevision: report.input_revision };
export const imageReview = ImageReviewStateSchema.parse({ report_id: report.report_id, job: { job_id: imageBinding.jobId, session_id: session.session_id, generation: 1,
  report_id: report.report_id, input_digest: imageBinding.inputDigest, model: "fixture-only-no-model-call", model_config_hash: "b".repeat(64), rubric_version: "image-quality-v1",
  status: "completed", result: { quality_ratings: { sharpness: 1, lighting: 2, scene_visibility: 1, detail: 2 }, visible_summary: "Synthetic fixture: mặt đường có nước.",
    report_match: "yes", mismatch_notes: [], reasons: ["Fixture rubric example"], quality_score: 75, recommendation: "looks_consistent" }, error_code: null,
  created_at: "2026-10-31T00:12:00Z", deadline_at: "2026-10-31T00:13:00Z", completed_at: "2026-10-31T00:12:30Z" } });

export const driverRoute = RouteSchema.parse({ route_id: "route_fixture001", driver_id: driverDashboard.driver_id, input_revision: 4,
  segment_ids: ["segment_E270001"], stops: driverDashboard.driver.ordered_stops, eta_minute: null, evidence_ids: [], unknown_segment_ids: ["segment_E270001"],
  status: "candidate", distance_m: 180, candidate_context_hash: "fixture-context", origin_node_id: "node_fixture001", assignment_overrides: [] });
