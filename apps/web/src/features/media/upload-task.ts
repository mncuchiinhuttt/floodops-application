import { createIdempotencyKey, TransportError, type PreparedRequest } from "@floodops/api-client";
import { MediaUploadInputSchema, type Media } from "@floodops/contracts";
import type { WebRuntime } from "../../app/runtime";
import { failureText } from "../../app/failure";
import { FeatureAccessError } from "../../shared/client-context";

type UploadFile = Pick<File, "name" | "size" | "type" | "arrayBuffer">;
export type UploadState = { phase: "idle" | "reading" | "reserving" | "uploading" | "normalizing" } |
  { phase: "failed"; message: string; canRetry: boolean } | { phase: "ready"; media: Media };
export const IDLE_UPLOAD: UploadState = { phase: "idle" };
export class MediaUploadTask {
  private state: UploadState = IDLE_UPLOAD;
  private listeners = new Set<() => void>();
  private controller = new AbortController();
  private captured: ReturnType<WebRuntime["context"]> | null = null;
  private detach = () => {};
  private reserve: PreparedRequest<"reserveMediaUpload"> | null = null;
  private content: PreparedRequest<"uploadMediaContent"> | null = null;
  private complete: PreparedRequest<"completeMediaUpload"> | null = null;
  private bytes: Uint8Array<ArrayBuffer> | null = null;
  private uploadId: string | null = null;
  private busy = false;
  private serial = 0;
  constructor(private readonly runtime: WebRuntime) {}
  snapshot = (): UploadState => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(state: UploadState) { this.state = state; this.listeners.forEach(listener => listener()); }
  private current(serial: number) {
    const context = this.runtime.context(), previous = this.captured;
    if (serial !== this.serial || this.controller.signal.aborted || !previous || context.scope !== previous.scope ||
      context.identity.participant.participant_id !== previous.identity.participant.participant_id || !context.online)
      throw new FeatureAccessError("Ảnh thuộc phiên cũ hoặc đang offline. Chọn lại khi đã xem lại phiên.");
    return context;
  }
  clear = () => {
    this.serial++; this.controller.abort(); this.controller = new AbortController(); this.detach(); this.detach = () => {};
    this.reserve = null; this.content = null; this.complete = null; this.bytes = null; this.uploadId = null; this.captured = null; this.busy = false;
    this.publish(IDLE_UPLOAD);
  };
  dispose() { this.clear(); this.listeners.clear(); }
  async select(file: UploadFile) {
    this.clear(); const serial = this.serial;
    const parsed = MediaUploadInputSchema.safeParse({ content_type: file.type, byte_length: file.size, original_filename: file.name });
    if (!parsed.success) { this.publish({ phase: "failed", message: "Chọn đúng một ảnh PNG/JPEG, tên hợp lệ và kích thước 1 byte–5 MiB.", canRetry: false }); return; }
    try {
      this.captured = this.runtime.context();
      const stop = () => this.clear(); this.captured.scope.signal.addEventListener("abort", stop, { once: true });
      this.detach = () => this.captured?.scope.signal.removeEventListener("abort", stop);
      this.current(serial); this.publish({ phase: "reading" });
      const bytes = new Uint8Array(await file.arrayBuffer()); this.current(serial); this.bytes = bytes;
      if (this.bytes.byteLength !== file.size) throw new FeatureAccessError("Kích thước file thay đổi. Chọn lại ảnh.");
      this.reserve = this.runtime.bound.prepare("reserveMediaUpload", "media:write", this.captured.identity.participant.role, context => ({
        path: { session_id: context.identity.session.session_id }, headers: { "Idempotency-Key": createIdempotencyKey() }, body: parsed.data,
      }));
      await this.run(serial);
    } catch (error) { this.failed(error, serial); }
  }
  private failed(error: unknown, serial: number) {
    if (serial !== this.serial || this.controller.signal.aborted) return;
    this.publish({ phase: "failed", message: failureText(error), canRetry: error instanceof TransportError });
  }
  async retry() { if (this.state.phase === "failed" && this.state.canRetry) await this.run(this.serial); }
  private async run(serial: number) {
    if (this.busy) return; this.busy = true;
    try {
      let context = this.current(serial);
      if (!this.uploadId) {
        this.publish({ phase: "reserving" });
        const result = await this.reserve!.send({ signal: this.controller.signal }); this.current(serial);
        this.uploadId = result.body.data.upload_id;
      }
      if (!this.complete) {
        context = this.current(serial);
        this.content ??= this.runtime.bound.prepare("uploadMediaContent", "media:write", context.identity.participant.role, current => ({
          path: { session_id: current.identity.session.session_id, upload_id: this.uploadId! }, headers: { "Idempotency-Key": createIdempotencyKey() }, body: this.bytes!,
        }));
        this.publish({ phase: "uploading" }); await this.content.send({ signal: this.controller.signal }); context = this.current(serial);
        this.complete = this.runtime.bound.prepare("completeMediaUpload", "media:write", context.identity.participant.role, current => ({
          path: { session_id: current.identity.session.session_id, upload_id: this.uploadId! }, headers: { "Idempotency-Key": createIdempotencyKey() }, body: { confirm_uploaded: true },
        }));
      }
      this.publish({ phase: "normalizing" });
      const result = await this.complete.send({ signal: this.controller.signal }); this.current(serial);
      const media = result.body.data;
      this.current(serial); this.reserve = null; this.content = null; this.complete = null; this.bytes = null;
      this.publish({ phase: "ready", media });
    } catch (error) { this.failed(error, serial); }
    finally { if (serial === this.serial) this.busy = false; }
  }
}
