/** Disclosed synthetic fixtures only. Never imported by production feature modules. */
import type { ContributorDashboard, DriverDashboard, Event, ImageReviewJob, Plan, Report, Results, Role, SessionMeta } from "@floodops/contracts";
import type { MobileContext } from "../src/shared/session-context";
export const fixtureSession: SessionMeta = {
  session_id: "ses_fixture01", generation: 1, revision: 3, event_sequence: 5, scenario_id: "scn_fixture01",
  scenario_version: "fixture-v1", sim_minute: 10, horizon_minute: 60, status: "active", calibration_status: "incomplete",
  created_at: "2026-10-31T00:00:00Z", expires_at: "2026-11-01T00:00:00Z",
};
export function fixtureContext(role: Role = "dispatcher"): MobileContext {
  const permissions = role === "dispatcher" ? ["session:read", "operations:read", "knowledge:read", "planning:request", "planning:decide", "planning:execute", "reports:review", "simulation:advance", "simulation:reset", "results:read"] as const
    : role === "driver" ? ["driver:self:read", "reports:submit"] as const : role === "contributor" ? ["contributor:self:read", "reports:submit"] as const : ["session:read"] as const;
  return { session: { ...fixtureSession }, participant: { participant_id: `par_${role}01`, role, bound_entity_id: role === "driver" ? "drv_fixture01" : "con_fixture01",
    expires_at: "2026-11-01T00:00:00Z", permissions: [...permissions], is_owner: false },
    nowMs: Date.parse("2026-10-31T12:00:00Z"), online: false, freshness: "current" };
}
export function fixtureReport(): Report {
  return { report_id: "rep_fixture01", participant_id: "par_contributor01", kind: "citizen", segment_id: "seg_fixture01", coordinate: null,
    captured_at: "2026-10-31T00:10:00Z", captured_sim_minute: 10, received_at: "2026-10-31T00:11:00Z", vehicle_types: ["motorbike"],
    description: "Synthetic road photo description", media_id: "med_fixture01", fixture_photo_id: null, status: "pending_review", reason_codes: [],
    observation_ids: [], award_id: null, reward: { status: "pending_config", policy: null, reason_code: "POLICY_NOT_CONFIGURED", award_id: null },
    review_result_id: null, reviewed_at: null, input_revision: 3, observation_candidates: [], input_mode: "photo", quick_condition: null, reporter_entity_id: "con_fixture01" };
}
export function fixtureDriver(): DriverDashboard {
  return { driver_id: "drv_fixture01", session: { ...fixtureSession }, driver: {
    driver_id: "drv_fixture01", vehicle_type: "motorbike", capacity: [{ dimension: "load", value: 10, unit: "kg", parameter_key: "capacity" }],
    load: [{ dimension: "load", value: 1, unit: "kg", parameter_key: "load" }], position: { kind: "node", node_id: "nod_fixture01", segment_id: null, entered_sim_minute: null, exit_sim_minute: null },
    status: "waiting", carrying_order_ids: [], ordered_stops: [{ stop_id: "stp_fixture01", order_id: "ord_fixture01", kind: "pickup", node_id: "nod_fixture01", service_minute: 2 }] },
    assigned_orders: [{ order_id: "ord_fixture01", tier: "critical", demand: [{ dimension: "load", value: 1, unit: "kg", parameter_key: "demand" }],
      pickup_hub_id: "hub_fixture01", destination_node_id: "nod_fixture02", driver_id: "drv_fixture01", original_sla_minute: 30, eta_minute: null,
      service_minute: 2, lifecycle: "unpicked", delivered_at_minute: null, cumulative_defer_minute: 0, provenance_label: "simulated" }],
    route_ids: [], own_reports: [] };
}
export function fixtureContributor(): ContributorDashboard {
  return { contributor_id: "con_fixture01", session: { ...fixtureSession }, own_reports: [fixtureReport()], awards: [], points_total: 0,
    coverage: { covered_pairs: 0, relevant_pairs: 1, ratio: 0 } };
}
export function fixtureJob(status: ImageReviewJob["status"] = "completed"): ImageReviewJob {
  return { job_id: "irj_fixture01", session_id: fixtureSession.session_id, generation: 1, report_id: "rep_fixture01", input_digest: "a".repeat(64),
    model: "fixture-only", model_config_hash: "b".repeat(64), rubric_version: "image-quality-v1", status,
    result: status === "completed" ? { quality_ratings: { sharpness: 1, lighting: 2, scene_visibility: 1, detail: 2 }, quality_score: 75,
      report_match: "yes", visible_summary: "Synthetic visible road scene", mismatch_notes: [], reasons: ["Synthetic test reason"], recommendation: "looks_consistent" } : null,
    error_code: status === "failed" ? "MODEL_TIMEOUT" : null, created_at: "2026-10-31T00:10:00Z", deadline_at: "2026-10-31T00:12:00Z",
    completed_at: ["completed", "failed", "superseded"].includes(status) ? "2026-10-31T00:11:00Z" : null };
}
export function fixturePlan(): Plan {
  const objective = { critical_unreachable: 0, critical_late: 0, critical_delay_minute: 0, food_late: 0, total_late: 0, total_delay_minute: 0, total_unreachable: 0 };
  return { plan_id: "pln_fixture01", session_id: fixtureSession.session_id, generation: 1, input_revision: 3, planning_job_id: "job_fixture01", status: "ready",
    actions: [{ action_id: "act_fixture01", kind: "reroute", targets: { order_id: "ord_fixture01", driver_id: "drv_fixture01", hub_id: null, route_id: "rte_fixture01", defer_minute: null }, dependency_group_id: "grp_fixture01", depends_on_action_ids: [], reason: "Synthetic projected reroute",
      evidence_ids: [], rule_results: [], status: "ready" }], groups: [{ group_id: "grp_fixture01", action_ids: ["act_fixture01"], depends_on_group_ids: [] }], route_ids: [],
    objective_before: objective, objective_after: objective, diff: [{ entity_id: "ord_fixture01", change: "changed", before_eta_minute: 40, after_eta_minute: 25, reason: "Synthetic projection", evidence_ids: [] }], is_projected: true };
}
export function fixtureResults(): Results {
  const metrics = { critical_late: 0, total_late: 0, total_delay_minutes: 0, blocked_route_attempts: 0, blocked_proposal_attempts: 0, blocked_movement_attempts: 0,
    orders_reassigned: 0, updated_eta_previews: 0, unfinished_count: 1, unreachable_count: 1, executed_violations: 0 };
  return { session_id: fixtureSession.session_id, scenario_id: fixtureSession.scenario_id, scenario_version: "fixture-v1", config_hash: "fixture-config",
    horizon_minute: 60, observed_until_minute: 10, calibration_status: "incomplete", branches: [{ branch_id: "static", metrics, completed_at_horizon: false },
      { branch_id: "floodops", metrics: { ...metrics }, completed_at_horizon: false }], late_reduction_ratio: null, label: "Simulation result" };
}
export function fixtureEvent(type: Event["type"] = "image_review_changed", sequence = 6): Event {
  return { event_id: `evt_fixture${sequence}`, event_sequence: sequence, session_id: fixtureSession.session_id, generation: 1, revision: 3, sim_minute: 10,
    type, actor: "system", resource_ids: ["rep_fixture01", "irj_fixture01"], reason_code: null, replacement_session_id: null, created_at: "2026-10-31T00:11:00Z" };
}
