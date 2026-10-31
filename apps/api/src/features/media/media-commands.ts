import { parseSchema } from "@floodops/contracts";
import { sourceState } from "@floodops/domain/reporting";
import type { ReducerDefinition, RuntimeRegistry, TransitionContext } from "../../shared/index";
import { fail } from "../../shared/index";
import { object } from "../scenario/index";
import { MEDIA_LIMITS } from "./media-types";
import { assertUploadLive, mediaProjection, ownedUpload } from "./media-state";
import { beginWrite, trackWrite, reuseWrite, finishWrite, failWrite } from "./write-reducers";
function reserve(context: TransitionContext, value: unknown) {
  const input = object(value, ["input", "uploadId", "mediaId"]), declared = parseSchema("MediaUploadInput", input.input);
  const uploadId = parseSchema("Id", input.uploadId), mediaId = parseSchema("Id", input.mediaId), state = sourceState(context.snapshot.values);
  if (Object.keys(state.uploads).length >= MEDIA_LIMITS.reports) fail(429, "RATE_LIMITED");
  if (state.uploads[uploadId]) fail(409, "STATE_CONFLICT");
  const used = Object.values(state.uploads).filter(item => item.upload.status !== "failed" && (item.media || context.now < Date.parse(item.upload.expires_at)))
    .reduce((sum, item) => sum + (item.media?.byte_length ?? item.declaredBytes), 0);
  if (used + declared.byte_length > MEDIA_LIMITS.sessionBytes) fail(429, "RATE_LIMITED");
  const prefix = `sessions/${context.snapshot.meta.session_id}/uploads/${uploadId}`;
  const upload = parseSchema("MediaUpload", { upload_id: uploadId, status: "reserved", expires_at: context.snapshot.meta.expires_at,
    maximum_bytes: MEDIA_LIMITS.uploadBytes, content_path: `/api/v1/sessions/${context.snapshot.meta.session_id}/media-uploads/${uploadId}/content` });
  state.uploads[uploadId] = { upload, mediaId, ownerId: context.actor.participant.participant_id, generation: context.snapshot.meta.generation,
    contentType: declared.content_type, declaredBytes: declared.byte_length, rawBaseKey: `${prefix}/quarantine`, derivativeBaseKey: `${prefix}/normalized`,
    rawKey: "", derivativeKey: "", rawDigest: null, media: null, activeWriter: null, completedWriters: { raw: null, normalized: null }, duplicate: false };
  return { data: upload, values: { ...context.snapshot.values, sourcesMedia: state }, events: [] };
}
export function createMediaRegistry(): RuntimeRegistry {
  const command = (reduce: ReducerDefinition["reduce"]): ReducerDefinition => ({ permission: "media:write", operational: false, validate: value => value, reduce });
  return { commands: { "media-reserve": command(reserve), "media-authorize": command((context, value) => {
      const input = object(value, ["uploadId"]), record = ownedUpload(context, parseSchema("Id", input.uploadId));
      assertUploadLive(context, record); return { data: record.upload, events: [] }; }), "media-begin": command(beginWrite), "media-track": command(trackWrite), "media-reuse": command(reuseWrite), "media-finish": command(finishWrite), "media-fail": command(failWrite) },
    views: { "source-media": { permission: "media:read", roles: ["dispatcher", "driver", "contributor"], project: mediaProjection } } };
}
