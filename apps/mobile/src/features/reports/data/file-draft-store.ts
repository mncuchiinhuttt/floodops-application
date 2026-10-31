import { Directory, File, Paths } from "expo-file-system";
import { nativeKey } from "../../../shared/native/random-key";
import { IdSchema, VehicleTypeSchema } from "@floodops/contracts";
import type { DraftPort, ReportDraft } from "../report-draft";
export interface DraftNamespace { session_id: string; generation: number; participantId: string }
export function validateNamespace(owner: DraftNamespace): void {
  IdSchema.parse(owner.session_id); IdSchema.parse(owner.participantId);
  if (!Number.isSafeInteger(owner.generation) || owner.generation < 0) throw new Error("Invalid draft generation");
}
function directory(owner: DraftNamespace) {
  validateNamespace(owner);
  return new Directory(Paths.document, "floodops-drafts", owner.participantId, owner.session_id, String(owner.generation));
}
function decode(value: unknown, owner: DraftNamespace): ReportDraft {
  if (!value || typeof value !== "object") throw new Error("Invalid private draft");
  const draft = value as ReportDraft;
  if (draft.participantId !== owner.participantId || draft.session_id !== owner.session_id || draft.generation !== owner.generation ||
    !["driver", "citizen"].includes(draft.kind) || !Array.isArray(draft.vehicles) || draft.vehicles.some(v => !VehicleTypeSchema.safeParse(v).success) ||
    !["segment", "longitude", "latitude", "capturedAt", "simMinute", "description"].every(key => typeof Reflect.get(draft, key) === "string")) throw new Error("Invalid private draft scope");
  const photoPrefix = directory(owner).uri.replace(/\/+$/, "") + "/";
  if (draft.photo && (!draft.photo.handle.startsWith(photoPrefix) || !draft.photo.label || !/^photo-[0-9a-f]{32}\.bin$/.test(draft.photo.handle.slice(photoPrefix.length)))) throw new Error("Invalid private photo scope");
  return draft;
}
export function createFileDraftPort(owner: DraftNamespace): DraftPort {
  validateNamespace(owner);
  return {
    async save(draft) {
      if (draft.participantId !== owner.participantId) throw new Error("Foreign draft denied");
      const scope = { session_id: draft.session_id, generation: draft.generation, participantId: draft.participantId };
      const dir = directory(scope); dir.create({ intermediates: true, idempotent: true });
      let saved = { ...draft };
      if (draft.photo) {
        if (!draft.photo.handle.startsWith("file://")) throw new Error("Only local private photos can be saved");
        const privateRoot = new Directory(Paths.document, "floodops-drafts").uri.replace(/\/+$/, "") + "/";
        const ownRoot = new Directory(Paths.document, "floodops-drafts", owner.participantId).uri.replace(/\/+$/, "") + "/";
        if (draft.photo.handle.startsWith(privateRoot) && !draft.photo.handle.startsWith(ownRoot)) throw new Error("Foreign private photo denied");
        const destination = new File(dir, `photo-${nativeKey()}.bin`);
        if (draft.photo.handle !== destination.uri) await new File(draft.photo.handle).copy(destination);
        saved = { ...draft, photo: { ...draft.photo, handle: destination.uri } };
      }
      const parsed = decode(saved, scope);
      await new File(dir, `draft-${nativeKey()}.json`).write(JSON.stringify(parsed));
    },
    async load() {
      const dir = directory(owner); if (!dir.exists) return null;
      const files = dir.list().filter((item): item is File => item instanceof File && item.name.endsWith(".json"))
        .sort((a, b) => (b.modificationTime ?? 0) - (a.modificationTime ?? 0)).slice(0, 100);
      for (const file of files) { try { return decode(await file.json(), owner); } catch { /* Incomplete saves never destroy earlier drafts. */ } }
      return null;
    },
  };
}
/** Only explicit user review can load a retained prior-generation draft for the SAME principal. */
export async function retainedDrafts(participantId: string): Promise<ReportDraft[]> {
  IdSchema.parse(participantId); const root = new Directory(Paths.document, "floodops-drafts", participantId);
  if (!root.exists) return [];
  const output: ReportDraft[] = [];
  for (const session of root.list().slice(0, 50)) if (session instanceof Directory) {
    for (const generation of session.list().slice(0, 50)) if (generation instanceof Directory) {
      const owner = { participantId, session_id: session.name, generation: Number(generation.name) };
      try { const value = await createFileDraftPort(owner).load(); if (value) output.push(value); } catch { /* Corrupt entries are retained, never exposed. */ }
    }
  }
  return output;
}
