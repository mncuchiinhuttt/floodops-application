import { Hono } from "hono";
import { parseSchema } from "@floodops/contracts";
import type { AppEnv } from "../../shared/index";
import { fail } from "../../shared/index";
import { invoke, jsonBody, runtimeCall, send } from "../../app/index";
import { requestKey, resourceId, sha256, stableId, successful } from "../scenario/index";
import { actorId, mediaBucket, mediaState } from "./http-state";
import { boundedBytes } from "./bounded-bytes";
import { uploadContent, completeUpload } from "./upload-service";
export function createMediaRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  router.post("/sessions/:session_id/media-uploads", async c => {
    const key = requestKey(c), actor = await actorId(c), session = resourceId(c, "session_id");
    const input = parseSchema("MediaUploadInput", await jsonBody(c.req.raw));
    const reply = await invoke(c, runtimeCall(c, "command", { name: "media-reserve", key,
      payload: { input, uploadId: await stableId("upload", [session, actor, key]), mediaId: await stableId("media", [session, actor, key]) } }));
    return send(c, successful(reply, 201), "reserveMediaUpload");
  });
  router.put("/sessions/:session_id/media-uploads/:upload_id/content", uploadContent);
  router.post("/sessions/:session_id/media-uploads/:upload_id/completion", completeUpload);
  router.get("/sessions/:session_id/media/:media_id", async c => {
    const { reply, state } = await mediaState(c); if (reply.status >= 400) return send(c, reply);
    const mediaId = resourceId(c, "media_id"), record = state.uploads.find(item => item.media?.media_id === mediaId);
    if (!record?.media || record.upload.status !== "ready") fail(404, "NOT_FOUND");
    const object = await mediaBucket(c).get(record.derivativeKey);
    if (!object) fail(503, "STORAGE_UNAVAILABLE");
    const bytes = await boundedBytes(object.body);
    if (bytes.byteLength !== record.media.byte_length || await sha256(bytes) !== record.media.sha256) fail(503, "STORAGE_UNAVAILABLE");
    return c.newResponse(bytes, { status: 200, headers: { "Content-Type": record.media.content_type,
      "Content-Length": String(bytes.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  });
  return router;
}
