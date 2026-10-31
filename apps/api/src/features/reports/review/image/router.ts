import { Hono } from "hono";
import { parseSchema } from "@floodops/contracts";
import type { ImageReviewJob } from "@floodops/contracts";
import { authProof, createSessionRuntimeClient, fail, invoke, jsonBody, runtimeCall, send } from "../../../../shared/index";
import type { AppEnv, PlatformBindings, Reply, SessionRequestContext } from "../../../../shared/index";
import type { ImageReviewMediaPort, ImageReviewPort } from "./image-review-port";
import { runImageReview } from "./service";
import type { QueuedImageFailurePort } from "./service";
import { REVIEW_IMAGE_CONTEXT } from "../runtime-types";
export interface ImageReviewRouterOptions {
  media?: ImageReviewMediaPort; provider?: ImageReviewPort; failQueued?: QueuedImageFailurePort;
  prepare?: (context: SessionRequestContext, reportId: string) => Promise<unknown>;
}
interface ContextItem { report_id: string; description: string; normalized_hash: string | null; ready: boolean; duplicate: boolean; pending: boolean }
export function createImageReviewRouter(options: ImageReviewRouterOptions | ((env: PlatformBindings) => ImageReviewRouterOptions) = {}): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  router.get("/sessions/:session_id/reports/:report_id/image-review", async c => {
    const reportId = parseSchema("Id", c.req.param("report_id")), call = runtimeCall(c, "image-read", { name: reportId });
    const reply = await invoke(c, call);
    if (reply.status !== 404) return send(c, reply, "getReportImageReview");
    const checked = await invoke(c, runtimeCall(c, "view", { name: REVIEW_IMAGE_CONTEXT }));
    if (checked.status !== 200) return send(c, checked);
    if (!(checked.body.data as ContextItem[]).some(item => item.report_id === reportId)) fail(404, "NOT_FOUND");
    return send(c, { ...checked, body: { ...checked.body, data: { report_id: reportId, job: null } } }, "getReportImageReview");
  });
  router.post("/sessions/:session_id/reports/:report_id/image-review-jobs", async c => {
    const ports = typeof options === "function" ? options(c.env) : options;
    const reportId = parseSchema("Id", c.req.param("report_id"));
    parseSchema("ImageReviewJobInput", await jsonBody(c.req.raw));
    const call = runtimeCall(c, "view", { name: REVIEW_IMAGE_CONTEXT }), checked = await invoke(c, call);
    if (checked.status !== 200) return send(c, checked);
    let item = (checked.body.data as ContextItem[]).find(item => item.report_id === reportId);
    if (!item) fail(404, "NOT_FOUND");
    if (!ports.provider) fail(503, "MODEL_UNAVAILABLE");
    if (!ports.media) fail(503, "CONFIG_INCOMPLETE");
    if (item.duplicate) fail(422, "DUPLICATE_IMAGE");
    const proof = authProof(c.req.raw); if (!proof) fail(401, "UNAUTHENTICATED");
    const context: SessionRequestContext = { sessionId: call.sessionId, requestId: call.requestId, auth: proof };
    if (ports.prepare && item.pending) {
      await ports.prepare(context, reportId);
      const refreshed = await invoke(c, runtimeCall(c, "view", { name: REVIEW_IMAGE_CONTEXT }));
      if (refreshed.status !== 200) return send(c, refreshed);
      item = (refreshed.body.data as ContextItem[]).find(item => item.report_id === reportId);
    }
    if (!item?.ready) fail(409, "MEDIA_NOT_READY");
    const client = createSessionRuntimeClient(c.env), reply = await client.imageReview.reserve(context, reportId, c.req.header("Idempotency-Key") ?? "");
    if (reply.status !== 202) return send(c, reply);
    if (reply.effect) {
      const job = parseSchema("ImageReviewJob", reply.body.data) as ImageReviewJob;
      c.executionCtx.waitUntil(runImageReview({ metadata: client.imageReview, media: ports.media,
        provider: ports.provider, failQueued: ports.failQueued ?? client.imageReview.failQueued }, context, job, reply.effect.lease,
      { normalized_hash: item.normalized_hash!, description: item.description }).then(() => undefined));
    }
    return send(c, { ...reply, effect: undefined } as Reply, "createReportImageReview");
  });
  return router;
}
