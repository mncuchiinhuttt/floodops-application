import { parseSchema } from "@floodops/contracts";
import type { AppContext, Reply } from "../../shared/index";
import { fail } from "../../shared/index";
import { invoke, jsonBody, runtimeCall, send } from "../../app/index";
import { requestKey, resourceId, sha256, stableId, successful } from "../scenario/index";
import { bindings, mediaBucket, mediaState, recovery, uploadFrom } from "./http-state";
import { boundedBytes } from "./bounded-bytes";
import { imageShape, normalizeImage } from "./normalize-image";
import type { MediaPreparedData, MediaWriteTicket } from "./media-types";
async function authorized(c: AppContext, uploadId: string, key: string): Promise<Reply> {
  return invoke(c, runtimeCall(c, "command", { name: "media-authorize", key: await stableId("auth", [key, uploadId]), payload: { uploadId } }));
}
async function abort(c: AppContext, ticket: MediaWriteTicket): Promise<void> {
  try {
    const call = runtimeCall(c, "command", { name: "media-fail", key: await stableId("failure", [ticket.attemptId, ticket.writerId]),
      payload: { uploadId: ticket.uploadId, attemptId: ticket.attemptId, writerId: ticket.writerId } });
    await recovery(c).abortMediaWrite(JSON.stringify(call), ticket.recoveryId);
  } catch { /* Uncertain/stale writer keeps its unique durable recovery intent; never delete another writer's object. */ }
}
function result(prepared: Reply): Reply | null {
  const data = prepared.body.data as MediaPreparedData;
  if ("completed" in data) return data.completed;
  if ("ready" in data) return { ...prepared, body: { ...prepared.body, data: data.ready } };
  return null;
}
function beforeWrite(ticket: MediaWriteTicket): void {
  if (Date.now() >= ticket.writeDeadline) fail(409, "STATE_CONFLICT");
}
export async function uploadContent(c: AppContext): Promise<Response> {
  const key = requestKey(c), uploadId = resourceId(c, "upload_id");
  const permission = await authorized(c, uploadId, key); if (permission.status >= 400) return send(c, permission);
  const { reply, state } = await mediaState(c); if (reply.status >= 400) return send(c, reply);
  const record = uploadFrom(state, uploadId);
  if (c.req.header("Content-Type")?.split(";")[0] !== "application/octet-stream") fail(415, "INVALID_IMAGE");
  const bytes = await boundedBytes(c.req.raw.body);
  if (bytes.length !== record.declaredBytes) fail(422, "INVALID_IMAGE");
  imageShape(bytes, record.contentType);
  const digest = await sha256(bytes), attemptId = await stableId("attempt", [key, uploadId, "raw"]);
  const begin = runtimeCall(c, "command", { name: "media-begin", key, payload: { uploadId, attemptId, kind: "raw", digest } });
  const prepared = JSON.parse(await recovery(c).prepareMediaWrite(JSON.stringify(begin))) as Reply;
  if (prepared.status >= 400) return send(c, prepared);
  const completed = result(prepared); if (completed) return send(c, completed, "uploadMediaContent");
  const ticket = (prepared.body.data as { ticket: MediaWriteTicket }).ticket;
  try {
    const latest = await mediaState(c);
    if (latest.reply.status >= 400) { await abort(c, ticket); return send(c, latest.reply); }
    if (uploadFrom(latest.state, uploadId).activeWriter?.id !== ticket.writerId) fail(409, "STATE_CONFLICT");
    beforeWrite(ticket);
    await mediaBucket(c).put(ticket.key, bytes, { httpMetadata: { contentType: record.contentType } });
    const call = runtimeCall(c, "command", { name: "media-finish", key: await stableId("finish", [attemptId, ticket.writerId]),
      payload: { uploadId, attemptId, writerId: ticket.writerId, kind: "raw", digest, media: null } });
    const finished = JSON.parse(await recovery(c).finishMediaWrite(JSON.stringify(call), ticket.recoveryId)) as Reply;
    return send(c, finished, "uploadMediaContent");
  } catch (error) { await abort(c, ticket); throw error; }
}
export async function completeUpload(c: AppContext): Promise<Response> {
  const key = requestKey(c), uploadId = resourceId(c, "upload_id");
  parseSchema("UploadCompletionInput", await jsonBody(c.req.raw));
  const permission = await authorized(c, uploadId, key); if (permission.status >= 400) return send(c, permission);
  const { reply, state } = await mediaState(c); if (reply.status >= 400) return send(c, reply);
  const record = uploadFrom(state, uploadId), attemptId = await stableId("attempt", [key, uploadId, "normalized"]);
  const prepared = JSON.parse(await recovery(c).prepareMediaWrite(JSON.stringify(runtimeCall(c, "command", {
    name: "media-begin", key, payload: { uploadId, attemptId, kind: "normalized" } })))) as Reply;
  if (prepared.status >= 400) return send(c, prepared);
  const completed = result(prepared); if (completed) return send(c, successful(completed, 201), "completeMediaUpload");
  const ticket = (prepared.body.data as { ticket: MediaWriteTicket }).ticket;
  try {
    const latest = await mediaState(c);
    if (latest.reply.status >= 400) { await abort(c, ticket); return send(c, latest.reply); }
    if (uploadFrom(latest.state, uploadId).activeWriter?.id !== ticket.writerId) fail(409, "STATE_CONFLICT");
    beforeWrite(ticket);
    const raw = await mediaBucket(c).get(record.rawKey); if (!raw) fail(409, "MEDIA_NOT_READY");
    const bytes = await boundedBytes(raw.body); if (await sha256(bytes) !== record.rawDigest) fail(422, "INVALID_IMAGE");
    const normalized = await normalizeImage(bindings(c).IMAGES, bytes, record.contentType);
    const media = parseSchema("Media", { media_id: record.mediaId, status: "ready", content_type: normalized.contentType,
      byte_length: normalized.bytes.length, width: normalized.width, height: normalized.height,
      sha256: await sha256(normalized.bytes), created_at: new Date().toISOString() });
    beforeWrite(ticket);
    await mediaBucket(c).put(ticket.key, normalized.bytes, { httpMetadata: { contentType: normalized.contentType } });
    const finish = runtimeCall(c, "command", { name: "media-finish", key: await stableId("finish", [attemptId, ticket.writerId]),
      payload: { uploadId, attemptId, writerId: ticket.writerId, kind: "normalized", digest: null, media } });
    const finished = JSON.parse(await recovery(c).finishMediaWrite(JSON.stringify(finish), ticket.recoveryId)) as Reply;
    return send(c, successful(finished, 201), "completeMediaUpload");
  } catch (error) { await abort(c, ticket); throw error; }
}
