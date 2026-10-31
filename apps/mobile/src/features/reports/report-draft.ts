import { CitizenReportInputSchema, DriverReportInputSchema, type CitizenReportInput, type Condition,
  type DriverReportInput, type VehicleType } from "@floodops/contracts";
import { sameSession, type MobileContext } from "../../shared/session-context";
export interface LocalPhoto { handle: string; label: string }
export interface ReportDraft {
  session_id: string; generation: number; participantId: string; kind: "driver" | "citizen";
  segment: string; longitude: string; latitude: string; capturedAt: string; simMinute: string;
  description: string; vehicles: VehicleType[]; quick: Condition | null; photo: LocalPhoto | null;
  fixturePhotoId: string | null;
}
export type PickedPhoto = { kind: "selected"; photo: LocalPhoto } | { kind: "denied" | "cancelled" | "unavailable" };
export interface PhotoPort {
  pick(): Promise<PickedPhoto>;
  /** External adapter must upload/verify the selected image in this authorized session. */
  prepare?(photo: LocalPhoto, context: MobileContext): Promise<{ mediaId: string }>;
}
export interface DraftPort { save(draft: ReportDraft): Promise<void>; load(): Promise<ReportDraft | null> }
export function newReportDraft(context: MobileContext, capturedAt: string): ReportDraft {
  if (!["driver", "contributor"].includes(context.participant.role)) throw new Error("Only field workspaces create these drafts.");
  return { session_id: context.session.session_id, generation: context.session.generation,
    participantId: context.participant.participant_id, kind: context.participant.role === "driver" ? "driver" : "citizen",
    segment: "", longitude: "", latitude: "", capturedAt, simMinute: String(context.session.sim_minute),
    description: "", vehicles: [], quick: null, photo: null, fixturePhotoId: null };
}
export function draftNeedsRelink(draft: ReportDraft, context: MobileContext): boolean {
  return !sameSession(draft, context.session) || draft.participantId !== context.participant.participant_id;
}
/** Called only after explicit user review; original capture/photo metadata is retained. */
export function relinkDraft(draft: ReportDraft, context: MobileContext): ReportDraft {
  if (draft.participantId !== context.participant.participant_id) throw new Error("Draft belongs to another principal. Owner continuity is required.");
  const expected = context.participant.role === "driver" ? "driver" : context.participant.role === "contributor" ? "citizen" : null;
  if (draft.kind !== expected) throw new Error("Draft kind is outside the new server capability.");
  return { ...draft, session_id: context.session.session_id, generation: context.session.generation,
    participantId: context.participant.participant_id };
}
export function buildReportInput(draft: ReportDraft, context: MobileContext, mediaId: string | null = null): CitizenReportInput | DriverReportInput {
  if (draftNeedsRelink(draft, context)) throw new Error("Stale session—review before re-link.");
  if ((draft.kind === "driver" && context.participant.role !== "driver") ||
    (draft.kind === "citizen" && context.participant.role !== "contributor")) throw new Error("Draft kind is outside your server capability.");
  if (!draft.segment.trim() && (!draft.longitude.trim() || !draft.latitude.trim())) throw new Error("Choose a segment or enter longitude and latitude.");
  if (!draft.simMinute.trim()) throw new Error("Enter the capture simulation minute.");
  const coordinate = draft.longitude.trim() || draft.latitude.trim() ? [Number(draft.longitude), Number(draft.latitude)] : null;
  if (coordinate && (!draft.longitude.trim() || !draft.latitude.trim())) throw new Error("Enter both longitude and latitude.");
  const shared = { segment_id: draft.segment.trim() || null, coordinate, captured_at: draft.capturedAt,
    captured_sim_minute: Number(draft.simMinute), vehicle_types: draft.vehicles, description: draft.description };
  if (draft.kind === "driver") {
    if (!draft.quick && !draft.description.trim()) throw new Error("Describe the road or select a quick condition.");
    return DriverReportInputSchema.parse({ ...shared, kind: "driver", input_mode: draft.quick ? "quick" : "text", quick_condition: draft.quick });
  }
  if (!mediaId && !draft.fixturePhotoId) throw new Error("A verified photo or permitted fixture is required. Photo upload is unavailable without its adapter.");
  return CitizenReportInputSchema.parse({ ...shared, kind: "citizen", media_id: mediaId, fixture_photo_id: draft.fixturePhotoId });
}
