import type { Media, MediaUpload, Participant, Report } from "@floodops/contracts";
import type { KnowledgePair } from "../knowledge/current-evidence.ts";
export interface StoredSourceReport {
  report: Report; originalSubmitter: Participant; boundVehicleTypes: Report["vehicle_types"];
  capturedEpochs: KnowledgePair[]; sourceId: string; generation: number; normalizedDigest: string | null;
}
export interface StoredSourceUpload {
  upload: MediaUpload; ownerId: string; generation: number; contentType: Media["content_type"]; declaredBytes: number;
  mediaId: string; rawBaseKey: string; derivativeBaseKey: string;
  /** Empty until the corresponding unique writer successfully attaches its object. */
  rawKey: string; derivativeKey: string; rawDigest: string | null; media: Media | null;
  activeWriter: null | { id: string; attemptId: string; deadline: number; key: string; kind: "raw" | "normalized" };
  completedWriters: { raw: null | { id: string; attemptId: string }; normalized: null | { id: string; attemptId: string } };
  duplicate: boolean;
}
export interface SourcesMediaState {
  version: 1; epochHistory: { segment_id: string; vehicle_type: Report["vehicle_types"][number]; knowledge_epoch: number; atMinute: number }[]; reports: Record<string, StoredSourceReport>; uploads: Record<string, StoredSourceUpload>; replayedFixtureIds: string[];
}
export function sourceState(values: Record<string, unknown>): SourcesMediaState {
  const value = values.sourcesMedia as SourcesMediaState | undefined;
  if (!value) return { version: 1, epochHistory: [], reports: {}, uploads: {}, replayedFixtureIds: [] };
  if (value.version !== 1 || !value.reports || !value.uploads || !Array.isArray(value.replayedFixtureIds)) throw new Error("CONFIG_INCOMPLETE");
  return { ...structuredClone(value), epochHistory: structuredClone(value.epochHistory ?? []) };
}
