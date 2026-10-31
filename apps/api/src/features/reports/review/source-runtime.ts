import { Hono } from "hono";
import type { AppEnv, PlatformBindings } from "../../../shared/index";
import type { SourcesPorts } from "../../scenario/index";
import { createSourceReviewPort, createSourceImagePreparationRegistry, prepareSourceReviewImage,
  createSourceImageReviewMediaPort } from "../index";
import { createReviewRuntime } from "./index";
import { imageContextKey, prepareImageReviewBinding } from "./image/binding";
import { createImageReviewRouter } from "./image/router";
import type { ImageReviewPort } from "./image/image-review-port";
import type { ReviewOptions } from "./runtime-types";

export interface SourceBackedReviewOptions extends Omit<ReviewOptions, "source"> {
  imageProvider?: (env: PlatformBindings) => ImageReviewPort | undefined;
}
/** Root supplies its genuine shared scenario/persistence ports and server-only provider. */
export function createSourceBackedReviewRuntime(ports: SourcesPorts, options: SourceBackedReviewOptions) {
  const source = createSourceReviewPort(ports), review = createReviewRuntime({ ...options, source });
  const preparation = options.imageConfig ? { config: options.imageConfig,
    prepare: prepareImageReviewBinding, contextKey: imageContextKey } : null;
  const binding = preparation ? createSourceImagePreparationRegistry(ports, preparation) : {};
  const images = createImageReviewRouter(env => preparation ? {
    provider: options.imageProvider?.(env), media: createSourceImageReviewMediaPort(env, preparation),
    prepare: (context, reportId) => prepareSourceReviewImage(env, preparation, context, reportId),
  } : {});
  const registry = { ...review.registry,
    commands: { ...review.registry.commands, ...binding.commands }, views: { ...review.registry.views, ...binding.views } };
  const router = new Hono<AppEnv>(); router.route("/", review.router); router.route("/", images);
  return { source, registry, router };
}
