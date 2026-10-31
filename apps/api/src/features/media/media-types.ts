import type { Media } from "@floodops/contracts";
import type { AppEnv, PlatformBindings } from "../../shared/index";
export const MEDIA_LIMITS = Object.freeze({ uploadBytes: 5_242_880, dimension: 4096, sessionBytes: 104_857_600, reports: 500, writerLeaseMs: 60_000 });
export interface MediaBindings extends PlatformBindings { IMAGES?: ImagesBinding; SCENARIO_ASSETS?: R2Bucket }
export type MediaEnv = AppEnv & { Bindings: MediaBindings };
export interface ImageShape { contentType: Media["content_type"]; width: number; height: number }
export interface MediaWriteTicket {
  recoveryId: string; writerId: string; attemptId: string; sessionId: string; generation: number; uploadId: string;
  key: string; writeDeadline: number; retainUntil: number; kind: "raw" | "normalized";
}
export interface MediaRecoveryRpc {
  prepareMediaWrite(serializedCall: string): Promise<string>;
  finishMediaWrite(serializedCall: string, recoveryId: string): Promise<string>;
  abortMediaWrite(serializedCall: string, recoveryId: string): Promise<string>;
}

/** Internal RPC data only; canonical upload/media HTTP representations do not change. */
export interface MediaBeginData {
  uploadId: string; attemptId: string; kind: "raw" | "normalized"; retainUntil: number; ready: unknown;
}
export type MediaPreparedData = { ticket: MediaWriteTicket } | { ready: unknown } | { completed: import("../../shared/index").Reply };
