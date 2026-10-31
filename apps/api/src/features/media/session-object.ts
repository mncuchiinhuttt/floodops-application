import { createSessionObject } from "../../session-runtime/index";
import type { StoredSourceUpload } from "@floodops/domain/reporting";
import { errorReply, fail } from "../../shared/index";
import type { Call, Reply, RuntimeRegistry, PlatformBindings } from "../../shared/index";
import { stableId } from "../scenario/index";
import { MediaRecoveryStore } from "./recovery-store";
import { MEDIA_LIMITS } from "./media-types";
import type { MediaBeginData, MediaWriteTicket } from "./media-types";
/** All methods are binding-only; registered pure reducers still authenticate every state change. */
export function createSourcesSessionObject(registry: RuntimeRegistry) {
  const Base = createSessionObject(registry);
  return class SourcesSessionDO extends Base {
    private readonly mediaRecovery: MediaRecoveryStore;
    constructor(ctx: DurableObjectState, env: PlatformBindings) {
      super(ctx, env); this.mediaRecovery = new MediaRecoveryStore(ctx, env.REPORT_MEDIA);
    }
    private async mediaCall(call: Call): Promise<Reply> {
      return JSON.parse(await super.dispatch(JSON.stringify(call))) as Reply;
    }
    private async replayFinished(call: Call, data: MediaBeginData, record: StoredSourceUpload, writerId: string): Promise<Reply> {
      const result = await this.mediaCall({ ...call, name: "media-finish", key: await stableId("finish", [data.attemptId, writerId]),
        payload: { uploadId: data.uploadId, attemptId: data.attemptId, writerId, kind: data.kind,
          digest: data.kind === "raw" ? record.rawDigest : null, media: data.kind === "normalized" ? record.media : null } });
      if (result.status < 400) await this.mediaRecovery.finish(writerId, true); // Compact a stopped row left by a crash after attach.
      return { ...result, body: { ...result.body, data: result.status < 400 ? { completed: result } : result.body.data } };
    }
    async prepareMediaWrite(serializedCall: string): Promise<string> {
      const call = JSON.parse(serializedCall) as Call;
      try {
        if (call.kind !== "command" || call.name !== "media-begin") throw new Error("Invalid media prepare command");
        const reply = await this.mediaCall(call); if (reply.status >= 400) return JSON.stringify(reply);
        const data = reply.body.data as MediaBeginData;
        if (data.ready) return JSON.stringify(reply);
        const current = await this.mediaCall({ ...call, kind: "view", name: "source-media" });
        if (current.status >= 400) return JSON.stringify(current);
        const record = (current.body.data as { uploads: StoredSourceUpload[] }).uploads.find(item => item.upload.upload_id === data.uploadId);
        if (!record) fail(404, "NOT_FOUND");
        const completed = record.completedWriters[data.kind];
        if (completed?.attemptId === data.attemptId) return JSON.stringify(await this.replayFinished(call, data, record, completed.id));
        if (data.kind === "raw" ? Boolean(record.rawKey) : Boolean(record.media)) {
          return JSON.stringify(await this.mediaCall({ ...call, name: "media-reuse", key: await stableId("reuse", [data.attemptId]),
            payload: { uploadId: data.uploadId, attemptId: data.attemptId, kind: data.kind } }));
        }
        if (record.activeWriter && record.activeWriter.deadline > Date.now()) fail(409, "STATE_CONFLICT");
        const writerId = `writer_${crypto.randomUUID().replaceAll("-", "")}`;
        const ticket: MediaWriteTicket = { recoveryId: writerId, writerId, attemptId: data.attemptId, sessionId: call.sessionId,
          generation: record.generation, uploadId: data.uploadId, kind: data.kind,
          key: `${data.kind === "raw" ? record.rawBaseKey : record.derivativeBaseKey}/${writerId}`,
          writeDeadline: Math.min(Date.now() + MEDIA_LIMITS.writerLeaseMs, Date.parse(record.upload.expires_at)), retainUntil: data.retainUntil };
        // Recovery intent precedes lease acquisition and every possible external write.
        await this.mediaRecovery.prepare(ticket);
        const tracked = await this.mediaCall({ ...call, name: "media-track", key: await stableId("track", [writerId]), payload: { ticket } });
        if (tracked.status >= 400) await this.mediaRecovery.finish(writerId, false); // No writer ever started.
        return JSON.stringify(tracked);
      } catch (error) { return JSON.stringify(errorReply(error, call.requestId)); }
    }
    async finishMediaWrite(serializedCall: string, recoveryId: string): Promise<string> {
      const call = JSON.parse(serializedCall) as Call, ticket = this.mediaRecovery.ticket(recoveryId);
      const value = call.payload as { uploadId?: string; attemptId?: string; writerId?: string; kind?: string };
      if (call.kind !== "command" || call.name !== "media-finish" || !ticket || value.writerId !== ticket.writerId
        || value.attemptId !== ticket.attemptId || value.uploadId !== ticket.uploadId || value.kind !== ticket.kind
        || call.sessionId !== ticket.sessionId) throw new Error("Invalid media finish command");
      // Writer promises have settled: this ID can never start another object write.
      await this.mediaRecovery.stopped(recoveryId);
      const reply = await this.mediaCall(call);
      await this.mediaRecovery.finish(recoveryId, reply.status < 400);
      return JSON.stringify(reply);
    }
    async abortMediaWrite(serializedCall: string, recoveryId: string): Promise<string> {
      const call = JSON.parse(serializedCall) as Call, ticket = this.mediaRecovery.ticket(recoveryId);
      const value = call.payload as { uploadId?: string; attemptId?: string; writerId?: string };
      if (call.kind !== "command" || call.name !== "media-fail" || !ticket || value.writerId !== ticket.writerId
        || value.attemptId !== ticket.attemptId || value.uploadId !== ticket.uploadId || call.sessionId !== ticket.sessionId) throw new Error("Invalid media abort command");
      await this.mediaRecovery.stopped(recoveryId);
      const reply = await this.mediaCall(call); // A stale writer cannot fail a replacement lease.
      await this.mediaRecovery.finish(recoveryId, false); // Delete only this stopped writer's unique object.
      return JSON.stringify(reply);
    }
    override async alarm(): Promise<void> {
      await super.alarm(); await this.mediaRecovery.drain(); await this.mediaRecovery.schedule();
    }
  };
}
