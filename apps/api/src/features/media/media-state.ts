import { sourceState } from "@floodops/domain/reporting";
import type { StoredSourceUpload } from "@floodops/domain/reporting";
import { fail } from "../../shared/index";
import type { TransitionContext } from "../../shared/index";
export function ownedUpload(context: TransitionContext, uploadId: string): StoredSourceUpload {
  const upload = sourceState(context.snapshot.values).uploads[uploadId];
  if (!upload || upload.generation !== context.snapshot.meta.generation || (context.actor.participant.role !== "dispatcher"
    && upload.ownerId !== context.actor.participant.participant_id)) fail(404, "NOT_FOUND");
  return upload;
}
export function mediaProjection(context: TransitionContext) {
  const state = sourceState(context.snapshot.values), actor = context.actor.participant;
  return { sessionId: context.snapshot.meta.session_id, generation: context.snapshot.meta.generation,
    uploads: Object.values(state.uploads).filter(item => item.generation === context.snapshot.meta.generation && (actor.role === "dispatcher" || item.ownerId === actor.participant_id)) };
}
export function assertUploadLive(context: TransitionContext, record: StoredSourceUpload): void {
  if (context.now >= Date.parse(record.upload.expires_at)) fail(410, "SESSION_EXPIRED");
  if (record.upload.status === "failed") fail(409, "MEDIA_NOT_READY");
}
