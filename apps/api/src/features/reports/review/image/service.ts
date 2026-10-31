import type { ImageReviewJob } from "@floodops/contracts";
import { deriveImageReviewAdvice } from "../rubric/index";
import type { ImageReviewMetadataPort, Reply, SessionRequestContext } from "../../../../shared/index";
import type { ImageReviewFailure, ImageReviewMediaPort, ImageReviewPort } from "./image-review-port";

export type QueuedImageFailurePort = (context: SessionRequestContext, reportId: string, jobId: string,
  lease: string, error: ImageReviewFailure) => Promise<Reply>;
export interface ImageReviewServiceOptions {
  metadata: ImageReviewMetadataPort; media: ImageReviewMediaPort; provider: ImageReviewPort;
  failQueued?: QueuedImageFailurePort;
}
export async function runImageReview(options: ImageReviewServiceOptions, context: SessionRequestContext, job: ImageReviewJob,
  lease: string, expected: { normalized_hash: string; description: string }): Promise<"completed" | "discarded"> {
  const controller = new AbortController();
  const remaining = Date.parse(job.deadline_at) - Date.now();
  if (remaining <= 0) return "discarded";
  const timeout = setTimeout(() => controller.abort(), remaining);
  let started = false;
  const completeFailure = async (code: ImageReviewFailure) => {
    try {
      if (started) await options.metadata.complete(context, job.report_id, job.job_id, lease, { error_code: code });
      else await (options.failQueued ?? options.metadata.failQueued)(context, job.report_id, job.job_id, lease, code);
    } catch { /* Persisted deadlines reconcile an unreachable/stale completion; never retry the provider. */ }
    return "discarded" as const;
  };
  try {
    const image = await options.media.read(context, job, controller.signal);
    const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(image.bytes).buffer));
    const digest = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    if (image.input_digest !== job.input_digest || image.normalized_hash !== expected.normalized_hash || digest !== expected.normalized_hash
      || image.description !== expected.description) return await completeFailure("STORAGE_UNAVAILABLE");
    const start = await options.metadata.start(context, job.report_id, job.job_id, lease);
    if (start.status !== 200) return "discarded";
    started = true;
    const outcome = await options.provider.review({ model: job.model, image }, controller.signal);
    if ("error_code" in outcome) return await completeFailure(outcome.error_code);
    let result;
    try { result = deriveImageReviewAdvice(outcome.output); }
    catch { return await completeFailure("MODEL_INVALID_OUTPUT"); }
    const completion = await options.metadata.complete(context, job.report_id, job.job_id, lease, { result });
    return completion.status === 200 ? "completed" : "discarded";
  } catch { return await completeFailure(controller.signal.aborted ? "MODEL_TIMEOUT" : started ? "MODEL_UNAVAILABLE" : "STORAGE_UNAVAILABLE"); }
  finally { clearTimeout(timeout); }
}
