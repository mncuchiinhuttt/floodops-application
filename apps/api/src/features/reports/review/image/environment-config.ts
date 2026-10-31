import { createHash } from "node:crypto";
import type { PlatformBindings } from "../../../../shared/platform-types";
import { MEDIA_LIMITS } from "../../../media/media-types";
import type { ImageConfig } from "./binding";
import type { ResponsesImageReviewConfig } from "./image-review-port";
import { IMAGE_REVIEW_PROMPT_VERSION } from "./responses-image-review";

const DEFAULT_MAX_OUTPUT_TOKENS = 512;
const MAX_OUTPUT_TOKENS = 1000;
const MAX_RESPONSE_BYTES = 65_536;
const TIMEOUT_MS = 20_000;

type ImageReviewEnvironment = Pick<PlatformBindings,
  "OPENAI_API_KEY" | "OPENAI_IMAGE_REVIEW_MODEL" | "OPENAI_IMAGE_REVIEW_ENABLED" | "OPENAI_IMAGE_REVIEW_MAX_OUTPUT_TOKENS">;

export interface ImageReviewRuntimeConfig {
  readonly imageConfig?: ImageConfig;
  readonly providerConfig?: ResponsesImageReviewConfig;
}

function outputTokenCount(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return DEFAULT_MAX_OUTPUT_TOKENS;
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= MAX_OUTPUT_TOKENS ? parsed : null;
}

/** Maps only explicit, complete Worker bindings to a backend-only image provider configuration. */
export function imageReviewConfigFromEnv(env: ImageReviewEnvironment): ImageReviewRuntimeConfig {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const model = env.OPENAI_IMAGE_REVIEW_MODEL?.trim();
  const maxOutputTokens = outputTokenCount(env.OPENAI_IMAGE_REVIEW_MAX_OUTPUT_TOKENS);
  if (env.OPENAI_IMAGE_REVIEW_ENABLED !== "true" || !apiKey || !model || model.length > 100 || maxOutputTokens === null) {
    return Object.freeze({});
  }

  const promptVersion = IMAGE_REVIEW_PROMPT_VERSION;
  const maxImageBytes = MEDIA_LIMITS.uploadBytes;
  const modelConfigHash = createHash("sha256").update(JSON.stringify({ provider: "openai-responses", model,
    prompt_version: promptVersion, max_output_tokens: maxOutputTokens, max_image_bytes: maxImageBytes,
    max_response_bytes: MAX_RESPONSE_BYTES, timeout_ms: TIMEOUT_MS })).digest("hex");
  const imageConfig: ImageConfig = Object.freeze({ model, model_config_hash: modelConfigHash, prompt_version: promptVersion });
  const providerConfig: ResponsesImageReviewConfig = Object.freeze({ enabled: true, apiKey, model, maxOutputTokens,
    maxImageBytes, maxResponseBytes: MAX_RESPONSE_BYTES, timeoutMs: TIMEOUT_MS });
  return Object.freeze({ imageConfig, providerConfig });
}
