import { parseSchema } from "@floodops/contracts";
import { fail } from "../../../shared/index";
import type { RuntimeRegistry } from "../../../shared/index";
import { createRewardViews } from "../../rewards/views";
import { resolveConflictTransition } from "../../knowledge/conflict-review/resolve-transition";
import { createReviewRouter } from "./router";
import { reviewImageBinding } from "./image/binding";
import { reviewReportTransition } from "./review-transition";
import { REVIEW_ACCEPT, REVIEW_REJECT, REVIEW_RESOLVE } from "./runtime-types";
import type { ReviewOptions } from "./runtime-types";

function payload(value: unknown, id: "report_id" | "conflict_id", schema: "ReviewInput" | "ConflictResolutionInput") {
  if (!value || typeof value !== "object" || Object.keys(value).some(key => ![id, "input"].includes(key))) fail(422, "INVALID_SCHEMA");
  const record = value as Record<string, unknown>;
  return { id: parseSchema("Id", record[id]), input: parseSchema(schema, record.input) };
}
export function createReviewRuntime(options: ReviewOptions) {
  const registry: RuntimeRegistry = { commands: {
    [REVIEW_ACCEPT]: { permission: "reports:review", operational: true,
      validate: value => payload(value, "report_id", "ReviewInput"), reduce(context, value) {
        const input = value as ReturnType<typeof payload>;
        const review = parseSchema("ReviewInput", input.input);
        if (review.decision !== "accept") fail(422, "INVALID_SCHEMA");
        return reviewReportTransition(options, context, input.id, review);
      } },
    [REVIEW_REJECT]: { permission: "reports:review", operational: false, requireCas: true, validate: value => payload(value, "report_id", "ReviewInput"),
      reduce(context, value) {
        const input = value as ReturnType<typeof payload>, review = parseSchema("ReviewInput", input.input);
        if (review.decision !== "reject") fail(422, "INVALID_SCHEMA");
        return reviewReportTransition(options, context, input.id, review);
      } },
    [REVIEW_RESOLVE]: { permission: "knowledge:resolve", operational: true,
      validate: value => payload(value, "conflict_id", "ConflictResolutionInput"), reduce(context, value) {
        const input = value as ReturnType<typeof payload>;
        return resolveConflictTransition(options, context, input.id, parseSchema("ConflictResolutionInput", input.input));
      } },
  }, views: createRewardViews(options), imageBinding: (snapshot, reportId) => reviewImageBinding(options, snapshot, reportId) };
  return { registry, router: createReviewRouter() };
}
export { createReviewSeed, reconcileReviewGaps } from "./state";
export { reviewReportTransition } from "./review-transition";
export { resolveConflictTransition } from "../../knowledge/conflict-review/resolve-transition";
export * from "./runtime-types";
export { prepareImageReviewBinding, imageContextKey } from "./image/binding";
export type { ImageMetadata, ImageConfig, PreparedImageBinding } from "./image/binding";
export { createImageReviewRouter } from "./image/router";
export type { ImageReviewRouterOptions } from "./image/router";
export { runImageReview } from "./image/service";
export type { ImageReviewServiceOptions, QueuedImageFailurePort } from "./image/service";
export { createResponsesImageReviewPort, IMAGE_REVIEW_PROMPT_VERSION } from "./image/responses-image-review";
export type { ImageReviewPort, ImageReviewMediaPort, ImageReviewFailure, ResponsesImageReviewConfig } from "./image/image-review-port";

export { prepareRewardPolicy } from "../../rewards/reward-policy";
export type { RewardPolicyPayload } from "../../rewards/reward-policy";

export { createSourceBackedReviewRuntime } from "./source-runtime";
export type { SourceBackedReviewOptions } from "./source-runtime";
