import { parseSchema } from "@floodops/contracts";
import type { Report } from "@floodops/contracts";
import type { ImageBinding, Snapshot } from "../../../../shared/index";
import type { ReviewOptions } from "../runtime-types";

export interface ImageConfig { readonly model: string; readonly model_config_hash: string; readonly prompt_version: string }
export interface PreparedImageBinding extends ImageBinding { readonly context_key: string }
export interface ImageMetadata {
  readonly normalized_hash: string; readonly ready: boolean; readonly duplicate: boolean;
  readonly prepared?: PreparedImageBinding;
}
export function imageContextKey(meta: { session_id: string; generation: number }, report: Report, media: ImageMetadata, config: ImageConfig): string {
  return JSON.stringify({ session: meta.session_id, generation: meta.generation, report: report.report_id, kind: report.kind,
    photo: [report.media_id, report.fixture_photo_id, media.normalized_hash], description: report.description,
    segment: report.segment_id, coordinate: report.coordinate, capture: [report.captured_at, report.captured_sim_minute],
    vehicles: [...report.vehicle_types].sort(), status: report.status, model: config.model,
    model_config_hash: config.model_config_hash, prompt_version: config.prompt_version, rubric: "image-quality-v1" });
}
/** Source/media owner calls outside transaction, then persists normalized metadata with the report. */
export async function prepareImageReviewBinding(meta: { session_id: string; generation: number }, report: Report,
  media: ImageMetadata, config: ImageConfig): Promise<PreparedImageBinding> {
  parseSchema("Report", report); parseSchema("Id", meta.session_id);
  if (!/^[a-f0-9]{64}$/.test(media.normalized_hash) || !/^[a-f0-9]{64}$/.test(config.model_config_hash)
    || !config.model || config.model.length > 100 || !Number.isSafeInteger(meta.generation) || meta.generation < 0) throw new Error("CONFIG_INCOMPLETE");
  const context_key = imageContextKey(meta, report, media, config);
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(context_key)));
  return { report_id: report.report_id, input_digest: Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join(""),
    model: config.model, model_config_hash: config.model_config_hash, rubric_version: "image-quality-v1", pending: true, context_key };
}
export function reviewImageBinding(options: ReviewOptions, snapshot: Snapshot, reportId: string): ImageBinding | null {
  const report = options.source.report(snapshot, reportId);
  if (!report) return null;
  const media = options.source.image(snapshot, report), prepared = media?.prepared;
  if (!media || !prepared) return null;
  const config = options.imageConfig;
  const current = config && prepared.context_key === imageContextKey(snapshot.meta, report, media, config)
    && prepared.model === config.model && prepared.model_config_hash === config.model_config_hash;
  return { report_id: reportId, input_digest: prepared.input_digest, model: prepared.model,
    model_config_hash: prepared.model_config_hash, rubric_version: "image-quality-v1",
    pending: !!current && report.status === "pending_review" && report.kind === "citizen" && report.input_mode === "photo"
      && media.ready && !media.duplicate };
}
