import { parseSchema, type ImageReviewAdvice, type ImageReviewJob } from "@floodops/contracts";
import type { AuthProof, BackgroundDriverKind, Call, PlatformBindings, Reply } from "./platform-types";
export interface SessionRequestContext { sessionId: string; requestId: string; auth: AuthProof }
/** Server-only serialized RPC client. Reducer functions are registered inside the DO, never sent here. */
export function createSessionRuntimeClient(env: PlatformBindings) {
  async function dispatch(call: Call): Promise<Reply> {
    parseSchema("Id", call.sessionId);
    const stub = env.SESSIONS.get(env.SESSIONS.idFromName(call.sessionId));
    return JSON.parse(await stub.dispatch(JSON.stringify(call))) as Reply;
  }
  async function startDriver(kind: BackgroundDriverKind, call: Call, reply: Reply): Promise<void> {
    parseSchema("Id", call.sessionId);
    const stub = env.SESSIONS.get(env.SESSIONS.idFromName(call.sessionId));
    await stub.startDriver(kind, JSON.stringify(call), JSON.stringify(reply));
  }
  return {
    dispatch,
    startDriver,
    imageReview: {
      reserve(context: SessionRequestContext, reportId: string, key: string): Promise<Reply> {
        return dispatch({ ...context, kind: "image-reserve", name: reportId, key,
          path: `/api/v1/sessions/${context.sessionId}/reports/${reportId}/image-review-jobs`, payload: {} });
      },
      read(context: SessionRequestContext, reportId: string): Promise<Reply> {
        return dispatch({ ...context, kind: "image-read", name: reportId });
      },
      start(context: SessionRequestContext, reportId: string, jobId: string, lease: string): Promise<Reply> {
        return dispatch({ ...context, kind: "image-start", name: reportId, payload: { job_id: jobId, lease } });
      },
      failQueued(context: SessionRequestContext, reportId: string, jobId: string, lease: string,
        error_code: NonNullable<ImageReviewJob["error_code"]>): Promise<Reply> {
        return dispatch({ ...context, kind: "image-fail-queued", name: reportId, payload: { job_id: jobId, lease, error_code } });
      },
      complete(context: SessionRequestContext, reportId: string, jobId: string, lease: string,
        outcome: { result: ImageReviewAdvice } | { error_code: NonNullable<ImageReviewJob["error_code"]> }): Promise<Reply> {
        return dispatch({ ...context, kind: "image-complete", name: reportId, payload: { job_id: jobId, lease, ...outcome } });
      },
    },
  };
}
export type SessionRuntimeClient = ReturnType<typeof createSessionRuntimeClient>;
export type ImageReviewMetadataPort = SessionRuntimeClient["imageReview"];
