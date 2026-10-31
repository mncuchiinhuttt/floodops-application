import type { Report } from "@floodops/contracts";
/** Observable input equality only; never a server input_digest or a new wire field. */
export function reportInputKey(report: Report): string {
  return JSON.stringify([report.report_id, report.kind, report.participant_id, report.reporter_entity_id,
    report.media_id, report.fixture_photo_id, report.description, report.segment_id, report.coordinate,
    report.captured_at, report.captured_sim_minute, [...report.vehicle_types].sort(), report.input_mode, report.quick_condition, report.status]);
}
