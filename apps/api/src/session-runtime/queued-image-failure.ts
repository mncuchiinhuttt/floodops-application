import { parseSchema, type ImageReviewJob } from "@floodops/contracts";
import { fail } from "../shared/platform-error";
export interface QueuedImageFailureInput { job_id: string; lease: string; error_code: NonNullable<ImageReviewJob["error_code"]> }
const errors: readonly NonNullable<ImageReviewJob["error_code"]>[] = ["MODEL_TIMEOUT", "MODEL_REFUSED", "MODEL_INVALID_OUTPUT", "MODEL_UNAVAILABLE", "STORAGE_UNAVAILABLE"];
/** Internal server command only; neither public image-review POST nor provider output. */
export function parseQueuedImageFailure(value: unknown): QueuedImageFailureInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(422, "INVALID_SCHEMA");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).length !== 3 || Object.keys(input).some(key => !["job_id", "lease", "error_code"].includes(key))) fail(422, "INVALID_SCHEMA");
  const job_id = parseSchema("Id", input.job_id);
  if (typeof input.lease !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(input.lease)) fail(422, "INVALID_SCHEMA");
  const error = parseSchema("ErrorCode", input.error_code);
  if (!errors.includes(error as QueuedImageFailureInput["error_code"])) fail(422, "INVALID_SCHEMA");
  return { job_id, lease: input.lease, error_code: error as QueuedImageFailureInput["error_code"] };
}
