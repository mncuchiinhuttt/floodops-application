import type { StoredSourceUpload } from "@floodops/domain/reporting";
import type { Participant } from "@floodops/contracts";
import type { AppContext, Reply } from "../../shared/index";
import { fail } from "../../shared/index";
import { invoke, runtimeCall } from "../../app/index";
import { view } from "../scenario/index";
import type { MediaBindings, MediaRecoveryRpc } from "./media-types";
export interface MediaProjection { sessionId: string; generation: number; uploads: StoredSourceUpload[] }
export async function mediaState(c: AppContext): Promise<{ reply: Reply; state: MediaProjection }> {
  const reply = await view(c, "source-media");
  if (reply.status >= 400) return { reply, state: { sessionId: "", generation: -1, uploads: [] } };
  return { reply, state: reply.body.data as MediaProjection };
}
export function uploadFrom(state: MediaProjection, id: string): StoredSourceUpload {
  const record = state.uploads.find(item => item.upload.upload_id === id);
  if (!record) fail(404, "NOT_FOUND");
  return record;
}
export function mediaBucket(c: AppContext): R2Bucket {
  if (!c.env.REPORT_MEDIA) fail(503, "STORAGE_UNAVAILABLE");
  return c.env.REPORT_MEDIA;
}
export function recovery(c: AppContext): MediaRecoveryRpc {
  const stub = c.env.SESSIONS.get(c.env.SESSIONS.idFromName(c.req.param("session_id")!)) as unknown as MediaRecoveryRpc;
  if (typeof stub.prepareMediaWrite !== "function") fail(503, "CONFIG_INCOMPLETE");
  return stub;
}
export async function actorId(c: AppContext): Promise<string> {
  const reply = await invoke(c, runtimeCall(c, "identity"));
  if (reply.status >= 400) fail(reply.status, "UNAUTHENTICATED");
  return (reply.body.data as { participant: Participant }).participant.participant_id;
}
export function bindings(c: AppContext): MediaBindings { return c.env as MediaBindings; }
