import { parseSchema } from "@floodops/contracts";
import type { Conflict, Report, SegmentKnowledge } from "@floodops/contracts";
import { sourceState } from "@floodops/domain/reporting";
import type { StoredSourceReport } from "@floodops/domain/reporting";
import type { Snapshot } from "../../shared/index";
import { fail } from "../../shared/index";
import type { ImageMetadata, PreparedImageBinding } from "./review/index";
export interface SourceReviewMetadata { conflicts: Conflict[]; imageBindings: Record<string, PreparedImageBinding> }
export function reviewMetadata(snapshot: Snapshot): SourceReviewMetadata {
  const value = snapshot.values.sourceReview as SourceReviewMetadata | undefined;
  return value ? structuredClone(value) : { conflicts: [], imageBindings: {} };
}
export function storedReport(snapshot: Snapshot, id: string): StoredSourceReport | null {
  const stored = sourceState(snapshot.values).reports[id];
  return stored?.generation === snapshot.meta.generation ? stored : null;
}
export function sourceImage(snapshot: Snapshot, report: Report): ImageMetadata | null {
  const state = sourceState(snapshot.values), stored = storedReport(snapshot, report.report_id);
  if (!stored || !stored.normalizedDigest || report.kind !== "citizen" || !same(report, stored.report)) return null;
  const upload = Object.values(state.uploads).find(item => item.media?.media_id === report.media_id);
  const ready = report.media_id !== null ? !!upload?.media && upload.generation === snapshot.meta.generation
    && upload.ownerId === stored.originalSubmitter.participant_id && upload.upload.status === "ready"
    && upload.media.sha256 === stored.normalizedDigest : report.fixture_photo_id !== null;
  const duplicate = !!upload?.duplicate || stored.report.reason_codes.includes("DUPLICATE_IMAGE");
  const prepared = reviewMetadata(snapshot).imageBindings[report.report_id];
  return { normalized_hash: stored.normalizedDigest, ready, duplicate, ...(prepared ? { prepared } : {}) };
}
export function currentSourceConflicts(snapshot: Snapshot, knowledge: readonly SegmentKnowledge[]): Conflict[] {
  const previous = reviewMetadata(snapshot).conflicts;
  const current = previous.filter(item => item.status === "resolved");
  for (const [index, pair] of knowledge.entries()) {
    if (pair.state !== "unresolved_conflict") continue;
    const existing = previous.find(item => item.status === "unresolved" && item.segment_id === pair.segment_id
      && item.vehicle_type === pair.vehicle_type && item.knowledge_epoch === pair.knowledge_epoch);
    const occurrence = previous.filter(item => item.segment_id === pair.segment_id && item.vehicle_type === pair.vehicle_type
      && item.knowledge_epoch === pair.knowledge_epoch).length;
    current.push(parseSchema("Conflict", { conflict_id: existing?.conflict_id ?? `conflict_${snapshot.meta.generation}_${index}_${pair.knowledge_epoch}_${occurrence}`,
      segment_id: pair.segment_id, vehicle_type: pair.vehicle_type, knowledge_epoch: pair.knowledge_epoch,
      observation_ids: pair.observation_ids, status: "unresolved", resolution_reason: null }));
  }
  return current;
}
export function same(left: unknown, right: unknown): boolean {
  const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])) : value;
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}
export function requireStored(snapshot: Snapshot, report: Report): StoredSourceReport {
  const stored = storedReport(snapshot, report.report_id);
  if (!stored || !same(stored.report, report)) fail(409, "STATE_CONFLICT");
  return stored;
}
