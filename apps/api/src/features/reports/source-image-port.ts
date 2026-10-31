import { parseSchema } from "@floodops/contracts";
import { createSessionRuntimeClient, fail, PlatformError } from "../../shared/index";
import type { PlatformBindings, Reply, SessionRequestContext } from "../../shared/index";
import { createNormalizedImagePort } from "../media/index";
import type { ImageReviewMediaPort } from "./review/index";
import type { SourceImagePreparationOptions, SourceImageProjection } from "./source-image-preparation";
function success(reply: Reply): void {
  if (reply.status >= 400) throw new PlatformError(reply.status, parseSchema("ErrorResponse", reply.body).error.code);
}
async function projection(env: PlatformBindings, context: SessionRequestContext): Promise<SourceImageProjection> {
  const reply = await createSessionRuntimeClient(env).dispatch({ ...context, kind: "view", name: "source-review-image-state" });
  success(reply); return reply.body.data as SourceImageProjection;
}
/** Canonical Review's SHA preparer is injected; actual private normalized bytes are verified first. */
export async function prepareSourceReviewImage(env: PlatformBindings, options: SourceImagePreparationOptions,
  context: SessionRequestContext, reportId: string) {
  parseSchema("Id", reportId);
  const before = await projection(env, context), item = before.reports.find(item => item.report.report_id === reportId);
  if (!item?.image?.ready) fail(409, "MEDIA_NOT_READY");
  if (item.image.duplicate) fail(422, "DUPLICATE_IMAGE");
  const normalized = await createNormalizedImagePort(env).read(context, reportId);
  if (normalized.generation !== before.generation || normalized.mediaDigest !== item.image.normalized_hash) fail(409, "STATE_CONFLICT");
  const prepared = await options.prepare({ session_id: before.sessionId, generation: before.generation }, item.report, item.image, options.config);
  const reply = await createSessionRuntimeClient(env).dispatch({ ...context, kind: "command", name: "source-review-image-prepare",
    key: `source_image_${prepared.input_digest}`, path: `source-review-image/${reportId}/${before.generation}`,
    payload: { generation: before.generation, report: item.report, prepared } });
  success(reply); return parsePrepared(reply.body.data, prepared.input_digest);
}
function parsePrepared(value: unknown, expectedDigest: string) {
  const binding = value as import("./review/index").PreparedImageBinding;
  if (binding?.input_digest !== expectedDigest) fail(409, "STATE_CONFLICT");
  return binding;
}
/** Real private image bytes plus the persisted canonical job binding, never the caller's digest. */
export function createSourceImageReviewMediaPort(env: PlatformBindings, options: SourceImagePreparationOptions): ImageReviewMediaPort {
  return { async read(context, expected, signal) {
    signal.throwIfAborted();
    const normalized = await createNormalizedImagePort(env).read(context, expected.report_id);
    signal.throwIfAborted();
    const current = await projection(env, context), item = current.reports.find(item => item.report.report_id === expected.report_id);
    const image = item?.image, binding = image?.prepared;
    if (current.generation !== normalized.generation || expected.generation !== current.generation || expected.session_id !== current.sessionId || !item || !image?.ready || image.duplicate || !binding
      || item.report.status !== "pending_review" || image.normalized_hash !== normalized.mediaDigest
      || binding.input_digest !== expected.input_digest || binding.model !== expected.model || binding.model_config_hash !== expected.model_config_hash
      || binding.context_key !== options.contextKey({ session_id: current.sessionId, generation: current.generation }, item.report, image, options.config)) fail(409, "STATE_CONFLICT");
    signal.throwIfAborted();
    return { input_digest: binding.input_digest, normalized_hash: normalized.mediaDigest, content_type: normalized.contentType,
      bytes: normalized.bytes, description: item.report.description };
  } };
}
