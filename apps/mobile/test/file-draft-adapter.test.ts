import { Directory, Paths } from "expo-file-system";
import { createFileDraftPort, retainedDrafts, validateNamespace } from "../src/features/reports/data/file-draft-store";
import { newReportDraft } from "../src/features/reports/report-draft";
import { nativeKey } from "../src/shared/native/random-key";
import { fixtureContext } from "../preview/fixture-data";
import { deferred } from "./adapter-fixtures";
import { mockStorage } from "./file-system-test-adapter";
jest.mock("expo-file-system", () => jest.requireActual("./file-system-test-adapter"));
jest.mock("../src/shared/native/random-key", () => ({ nativeKey: jest.fn() }));
beforeEach(() => { mockStorage.reset(); let key = 0; jest.mocked(nativeKey).mockImplementation(() => String(++key).padStart(32, "0")); });
function setup() {
  const context = fixtureContext("contributor");
  const owner = { session_id: context.session.session_id, generation: context.session.generation, participantId: context.participant.participant_id };
  const draft = newReportDraft(context, "2026-10-31T00:10:00Z");
  draft.description = "Private synthetic report"; draft.vehicles = ["motorbike"];
  return { owner, draft };
}
test("restart loads only the session/generation/principal private directory", async () => {
  const { owner, draft } = setup(); await createFileDraftPort(owner).save(draft);
  expect(await createFileDraftPort(owner).load()).toEqual(draft);
  expect(mockStorage.writes[0]).toContain(`/floodops-drafts/${owner.participantId}/${owner.session_id}/${owner.generation}/`);
  expect(await createFileDraftPort({ ...owner, participantId: "par_foreign01" }).load()).toBeNull();
  expect(await createFileDraftPort({ ...owner, session_id: "ses_foreign01" }).load()).toBeNull();
  expect(await createFileDraftPort({ ...owner, generation: owner.generation + 1 }).load()).toBeNull();
});
test("photo is copied into the private owner directory before a durable draft references it", async () => {
  const { owner, draft } = setup(); draft.photo = { handle: "file:///picker/original.jpg", label: "Local chosen photo" };
  mockStorage.seed(draft.photo.handle, new Uint8Array([255, 216, 255, 1]));
  const gate = deferred(); mockStorage.copyGate = gate.promise;
  const saving = createFileDraftPort(owner).save(draft); await Promise.resolve();
  expect(mockStorage.copies).toHaveLength(1); expect(mockStorage.writes).toEqual([]);
  gate.resolve(); await saving;
  const restarted = await createFileDraftPort(owner).load();
  expect(restarted?.photo?.handle).toContain(`/floodops-drafts/${owner.participantId}/${owner.session_id}/${owner.generation}/photo-`);
  expect(restarted?.photo?.handle).not.toBe(draft.photo.handle);
  expect(mockStorage.entries.has(draft.photo.handle)).toBe(true);
});
test("interrupted and corrupt latest saves retain the last complete private draft", async () => {
  const { owner, draft } = setup(); const port = createFileDraftPort(owner); await port.save(draft);
  mockStorage.failNextWrite = true;
  await expect(port.save({ ...draft, description: "Incomplete replacement" })).rejects.toThrow(/interrupted/);
  const dir = new Directory(Paths.document, "floodops-drafts", owner.participantId, owner.session_id, String(owner.generation));
  mockStorage.seed(`${dir.uri}/newer-corrupt.json`, "{unfinished");
  expect(await createFileDraftPort(owner).load()).toEqual(draft);
  expect(mockStorage.entries.has(`${dir.uri}/newer-corrupt.json`)).toBe(true);
});
test("foreign draft data is rejected even if injected into the correct private directory", async () => {
  const { owner, draft } = setup(); const port = createFileDraftPort(owner);
  await expect(port.save({ ...draft, participantId: "par_foreign01" })).rejects.toThrow(/Foreign/);
  const dir = new Directory(Paths.document, "floodops-drafts", owner.participantId, owner.session_id, String(owner.generation));
  dir.create({ intermediates: true, idempotent: true });
  mockStorage.seed(`${dir.uri}/injected.json`, JSON.stringify({ ...draft, participantId: "par_foreign01" }));
  expect(await port.load()).toBeNull();
});
test("draft persistence preserves every canonical vehicle type, including truck", async () => {
  const { owner, draft } = setup(); draft.vehicles = ["truck"];
  await createFileDraftPort(owner).save(draft);
  expect((await createFileDraftPort(owner).load())?.vehicles).toEqual(["truck"]);
});
test("same-owner Reset retains an old save without exposing it as the new generation", async () => {
  const { owner, draft } = setup(); const freshOwner = { ...owner, generation: owner.generation + 1 };
  await createFileDraftPort(freshOwner).save(draft);
  expect(await createFileDraftPort(freshOwner).load()).toBeNull();
  expect(await retainedDrafts(owner.participantId)).toEqual([draft]);
  expect(await retainedDrafts("par_foreign01")).toEqual([]);
  expect(await createFileDraftPort(owner).load()).toEqual(draft);
});
test.each([{ participantId: "../other" }, { session_id: "../../other" }, { generation: -1 }, { generation: 1.5 }])(
  "invalid namespace is rejected before creating any directory", override => {
    const { owner } = setup(); expect(() => validateNamespace({ ...owner, ...override })).toThrow();
    expect(mockStorage.entries.size).toBe(0);
  });
