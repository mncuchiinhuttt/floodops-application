import { parseSchema } from "@floodops/contracts";
import { sourceState } from "@floodops/domain/reporting";
import type { StoredSourceUpload } from "@floodops/domain/reporting";
import { fail } from "../../shared/index";
import type { TransitionContext, Transition } from "../../shared/index";
import { object } from "../scenario/index";
import { ownedUpload, assertUploadLive } from "./media-state";
import { MEDIA_LIMITS } from "./media-types";
import type { MediaWriteTicket } from "./media-types";
function hash(value: unknown): string {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) fail(422, "INVALID_SCHEMA");
  return value;
}
function save(context: TransitionContext, record: StoredSourceUpload, transition: Transition): Transition {
  const state = sourceState(context.snapshot.values); state.uploads[record.upload.upload_id] = record;
  return { ...transition, values: { ...context.snapshot.values, sourcesMedia: state }, events: [] };
}
function kindOf(value: unknown): "raw" | "normalized" {
  if (value !== "raw" && value !== "normalized") fail(422, "INVALID_SCHEMA");
  return value;
}
/** External semantic fingerprint: no writer allocation or resource lock in this cached outcome. */
export function beginWrite(context: TransitionContext, value: unknown): Transition {
  const input = object(value, ["uploadId", "attemptId", "kind", "digest"]);
  const record = ownedUpload(context, parseSchema("Id", input.uploadId)); assertUploadLive(context, record);
  const attemptId = parseSchema("Id", input.attemptId), kind = kindOf(input.kind);
  if (kind === "raw") {
    if (record.media) fail(409, "STATE_CONFLICT");
    const digest = hash(input.digest);
    if (record.rawDigest && record.rawDigest !== digest) fail(409, "IDEMPOTENCY_KEY_REUSED");
    record.rawDigest = digest;
  } else if (!record.rawKey || !record.rawDigest || !["uploaded", "processing", "ready"].includes(record.upload.status)) fail(409, "MEDIA_NOT_READY");
  const ready = kind === "raw" ? (record.rawKey ? record.upload : null) : record.media;
  return save(context, record, { data: { uploadId: record.upload.upload_id, attemptId, kind, ready, retainUntil: context.snapshot.absoluteExpiry } });
}
/** Deterministic no-write result for a new key whose resource completed concurrently. */
export function reuseWrite(context: TransitionContext, value: unknown): Transition {
  const input = object(value, ["uploadId", "attemptId", "kind"]);
  const record = ownedUpload(context, parseSchema("Id", input.uploadId)); assertUploadLive(context, record);
  parseSchema("Id", input.attemptId);
  const kind = kindOf(input.kind), ready = kind === "raw" ? (record.rawKey ? record.upload : null) : record.media;
  if (!ready) fail(409, "MEDIA_NOT_READY");
  return { data: { ready }, events: [] };
}
/** Atomic resource lease. A takeover changes both writer identity and object key. */
export function trackWrite(context: TransitionContext, value: unknown): Transition {
  const outer = object(value, ["ticket"]), valueTicket = object(outer.ticket, ["recoveryId", "writerId", "attemptId", "sessionId", "generation", "uploadId", "key", "writeDeadline", "retainUntil", "kind"]);
  const ticket = valueTicket as unknown as MediaWriteTicket;
  const record = ownedUpload(context, parseSchema("Id", ticket.uploadId)); assertUploadLive(context, record);
  const writerId = parseSchema("Id", ticket.writerId), attemptId = parseSchema("Id", ticket.attemptId), kind = kindOf(ticket.kind);
  const base = kind === "raw" ? record.rawBaseKey : record.derivativeBaseKey;
  if (ticket.recoveryId !== writerId || ticket.sessionId !== context.snapshot.meta.session_id || ticket.generation !== context.snapshot.meta.generation
    || ticket.key !== `${base}/${writerId}` || ticket.retainUntil !== context.snapshot.absoluteExpiry || !Number.isFinite(ticket.writeDeadline)
    || ticket.writeDeadline <= context.now || ticket.writeDeadline > context.now + MEDIA_LIMITS.writerLeaseMs
    || ticket.writeDeadline > Date.parse(record.upload.expires_at)) fail(409, "STATE_CONFLICT");
  if (record.activeWriter && record.activeWriter.deadline > context.now) fail(409, "STATE_CONFLICT");
  if (kind === "raw" ? Boolean(record.rawKey || record.media || !record.rawDigest) : Boolean(record.media || !record.rawKey)) fail(409, "STATE_CONFLICT");
  const previousKey = record.activeWriter?.key;
  record.activeWriter = { id: writerId, attemptId, deadline: ticket.writeDeadline, key: ticket.key, kind };
  if (kind === "normalized") record.upload.status = "processing";
  return save(context, record, { data: { ticket }, mediaKeys: [ticket.key], cleanupKeys: previousKey ? [previousKey] : [] });
}
export function finishWrite(context: TransitionContext, value: unknown): Transition {
  const input = object(value, ["uploadId", "attemptId", "writerId", "kind", "digest", "media"]);
  const record = ownedUpload(context, parseSchema("Id", input.uploadId)); assertUploadLive(context, record);
  const writer = record.activeWriter, writerId = parseSchema("Id", input.writerId), attemptId = parseSchema("Id", input.attemptId), kind = kindOf(input.kind);
  if (!writer || writer.id !== writerId || writer.attemptId !== attemptId || writer.kind !== kind || context.now >= writer.deadline) fail(409, "STATE_CONFLICT");
  const state = sourceState(context.snapshot.values), cleanupKeys: string[] = [];
  if (kind === "raw") {
    if (record.rawDigest !== hash(input.digest) || record.media) fail(409, "STATE_CONFLICT");
    record.rawKey = writer.key; record.upload.status = "uploaded";
  } else {
    const media = parseSchema("Media", input.media);
    if (media.media_id !== record.mediaId || media.content_type !== record.contentType) fail(422, "INVALID_IMAGE");
    record.duplicate = Object.values(state.uploads).some(other => other.upload.upload_id !== record.upload.upload_id && other.media?.sha256 === media.sha256);
    record.derivativeKey = writer.key; record.media = media; record.upload.status = "ready";
    if (record.rawKey) cleanupKeys.push(record.rawKey);
  }
  record.completedWriters[kind] = { id: writerId, attemptId }; record.activeWriter = null;
  return save(context, record, { data: kind === "raw" ? record.upload : record.media, cleanupKeys });
}
export function failWrite(context: TransitionContext, value: unknown): Transition {
  const input = object(value, ["uploadId", "attemptId", "writerId"]), record = ownedUpload(context, parseSchema("Id", input.uploadId));
  const writer = record.activeWriter;
  if (!writer || writer.id !== parseSchema("Id", input.writerId) || writer.attemptId !== parseSchema("Id", input.attemptId) || record.media) fail(409, "STATE_CONFLICT");
  record.upload.status = "failed"; record.activeWriter = null;
  return save(context, record, { data: record.upload, cleanupKeys: [...new Set([writer.key, record.rawKey, record.derivativeKey].filter(Boolean))] });
}
