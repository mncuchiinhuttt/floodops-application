import { createHash } from "node:crypto";
import { parseSchema } from "@floodops/contracts";
import type { Report } from "@floodops/contracts";
import type { RuntimeRegistry, Snapshot } from "../../shared/index";
import { fail } from "../../shared/index";
import type { SourcesPorts } from "../scenario/index";
import { object } from "../scenario/index";
import type { ImageConfig, ImageMetadata, PreparedImageBinding } from "./review/index";
import { requireStored, reviewMetadata, sourceImage, storedReport } from "./source-review-state";
export interface SourceImagePreparationOptions {
  config: ImageConfig;
  prepare(meta: Pick<Snapshot["meta"], "session_id" | "generation">, report: Report, image: ImageMetadata, config: ImageConfig): Promise<PreparedImageBinding>;
  contextKey(meta: Pick<Snapshot["meta"], "session_id" | "generation">, report: Report, image: ImageMetadata, config: ImageConfig): string;
}
export interface SourceImageProjection { sessionId: string; generation: number; reports: { report: Report; image: ImageMetadata | null }[] }
/** Registered binding-only metadata command. No HTTP route and no network work in its reducer. */
export function createSourceImagePreparationRegistry(_ports: SourcesPorts, options: SourceImagePreparationOptions): RuntimeRegistry {
  return { views: { "source-review-image-state": { permission: "reports:review", roles: ["dispatcher"], project: ({ snapshot }) => {
    const records = snapshot.values.sourcesMedia as { reports?: Record<string, { report: Report }> } | undefined;
    return { sessionId: snapshot.meta.session_id, generation: snapshot.meta.generation,
      reports: Object.values(records?.reports ?? {}).flatMap(item => storedReport(snapshot, item.report.report_id)
        ? [{ report: structuredClone(item.report), image: sourceImage(snapshot, item.report) }] : []) } satisfies SourceImageProjection;
  } } }, commands: { "source-review-image-prepare": { permission: "reports:review", operational: false, validate: raw => raw,
    reduce({ snapshot, actor }, raw) {
      if (actor.participant.role !== "dispatcher") fail(403, "FORBIDDEN");
      const value = object(raw, ["generation", "report", "prepared"]), report = parseSchema("Report", value.report);
      if (value.generation !== snapshot.meta.generation) fail(409, "STATE_CONFLICT");
      requireStored(snapshot, report);
      const image = sourceImage(snapshot, report);
      if (!image?.ready || report.kind !== "citizen" || report.status !== "pending_review") fail(409, "STATE_CONFLICT");
      if (image.duplicate) fail(422, "DUPLICATE_IMAGE");
      const prepared = object(value.prepared, ["report_id", "input_digest", "model", "model_config_hash", "rubric_version", "pending", "context_key"]);
      if (prepared.report_id !== report.report_id || typeof prepared.input_digest !== "string" || !/^[a-f0-9]{64}$/.test(prepared.input_digest)
        || prepared.model !== options.config.model || prepared.model_config_hash !== options.config.model_config_hash
        || prepared.rubric_version !== "image-quality-v1" || prepared.pending !== true
        || prepared.context_key !== options.contextKey(snapshot.meta, report, image, options.config)
        || prepared.input_digest !== createHash("sha256").update(prepared.context_key as string).digest("hex")) fail(409, "STATE_CONFLICT");
      const metadata = reviewMetadata(snapshot), binding = prepared as unknown as PreparedImageBinding;
      metadata.imageBindings[report.report_id] = structuredClone(binding);
      return { values: { ...snapshot.values, sourceReview: metadata }, data: binding, events: [] };
    } } } };
}
