import { ApiClient } from "@floodops/api-client";
import * as ImagePicker from "expo-image-picker";
import { createNativePhotoPort, imageContentType } from "../src/features/reports/data/native-photo-port";
import type { MobileContext } from "../src/shared/session-context";
import { deferred, onlineMediaContext } from "./adapter-fixtures";
import { mockStorage } from "./file-system-test-adapter";
jest.mock("expo-file-system", () => jest.requireActual("./file-system-test-adapter"));
jest.mock("expo-image-picker", () => ({ requestMediaLibraryPermissionsAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
beforeEach(() => { mockStorage.reset(); jest.clearAllMocks(); });
const jpeg = new Uint8Array([255, 216, 255, 1]);
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1]);
const photo = { handle: "file:///picker/photo.jpg", label: "Chosen local photo" };
function instrument() {
  const api = new ApiClient({ baseUrl: "https://fixture.invalid/api/v1", credentials: async () => ({ kind: "none" }) });
  const request = jest.spyOn(api, "request");
  return { api, request };
}
function response(data: unknown) {
  return { body: { success: true, data, error: null, meta: {} }, status: 200,
    etag: null, version: null, requestId: null, retryAfterMs: null };
}
function uploaded(operation: string) {
  return response(operation === "completeMediaUpload" ? { media_id: "med_normalized01" } : { upload_id: "upl_reserved01" });
}
test.each([[jpeg, "image/jpeg"], [png, "image/png"]] as const)("classifies actual supported bytes, not filename: %s", (bytes, expected) => {
  expect(imageContentType(bytes)).toBe(expected);
});
test("5MiB is an inclusive byte boundary and empty/unsupported contents fail before reserve", () => {
  const limit = new Uint8Array(5_242_880); limit.set(jpeg); expect(imageContentType(limit)).toBe("image/jpeg");
  const oversized = new Uint8Array(5_242_881); oversized.set(jpeg);
  expect(() => imageContentType(oversized)).toThrow(/limit/);
  expect(() => imageContentType(new Uint8Array())).toThrow(/limit/);
  expect(() => imageContentType(new Uint8Array([71, 73, 70, 56]))).toThrow(/JPEG\/PNG/);
});
test.each(["denied", "cancelled", "unsupported"] as const)("picker %s causes no upload request", async result => {
  const { api, request } = instrument(); const current = onlineMediaContext();
  jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({ granted: result !== "denied" } as never);
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue(result === "cancelled" ? { canceled: true, assets: null }
    : { canceled: false, assets: [{ uri: photo.handle, mimeType: "image/heic", width: 20, height: 20 }] } as never);
  const selected = await createNativePhotoPort(api, () => current, () => "synthetic-photo-key-00001").pick();
  expect(selected.kind).toBe(result === "unsupported" ? "unavailable" : result);
  if (result === "denied") expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
  expect(request).not.toHaveBeenCalled();
});
test("selected picker result requests neither EXIF nor base64 and retains a private local handle", async () => {
  const { api } = instrument(); const current = onlineMediaContext();
  jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({ granted: true } as never);
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false,
    assets: [{ uri: photo.handle, mimeType: "image/jpeg", width: 20, height: 20 }] } as never);
  await expect(createNativePhotoPort(api, () => current, () => "synthetic-photo-key-00001").pick())
    .resolves.toEqual({ kind: "selected", photo: { handle: photo.handle, label: "Selected local photo" } });
  expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({ mediaTypes: ["images"], allowsMultipleSelection: false, exif: false, base64: false });
});
test.each([[jpeg, "image/jpeg", "report.jpg"], [png, "image/png", "report.png"]] as const)(
  "reserve -> binary bytes -> completion returns only the normalized media ID (%s)", async (bytes, contentType, filename) => {
    const { api, request } = instrument(); const current = onlineMediaContext(); mockStorage.seed(photo.handle, bytes);
    request.mockImplementation(async operation => uploaded(operation) as never);
    let key = 0; const port = createNativePhotoPort(api, () => current, () => `synthetic-media-key-${++key}`);
    await expect(port.prepare!(photo, current)).resolves.toEqual({ mediaId: "med_normalized01" });
    const path = { session_id: current.session.session_id };
    expect(request.mock.calls.map(call => call[0])).toEqual(["reserveMediaUpload", "uploadMediaContent", "completeMediaUpload"]);
    expect(request.mock.calls[0]?.[1]).toEqual({ path, headers: { "Idempotency-Key": "synthetic-media-key-1" },
      body: { content_type: contentType, byte_length: bytes.byteLength, original_filename: filename } });
    expect(request.mock.calls[1]?.[1]).toEqual({ path: { ...path, upload_id: "upl_reserved01" },
      headers: { "Idempotency-Key": "synthetic-media-key-2" }, body: bytes });
    expect(request.mock.calls[2]?.[1]).toEqual({ path: { ...path, upload_id: "upl_reserved01" },
      headers: { "Idempotency-Key": "synthetic-media-key-3" }, body: { confirm_uploaded: true } });
    const scopes = request.mock.calls.map(call => call[2]?.scope);
    expect(scopes[0]?.signal.aborted).toBe(true); expect(scopes.every(scope => scope === scopes[0])).toBe(true);
  });
test.each(["reserveMediaUpload", "uploadMediaContent", "completeMediaUpload"] as const)(
  "principal change after %s stops the pipeline and never returns an old-owner media ID", async changedAfter => {
    const { api, request } = instrument(); const captured = onlineMediaContext(); let current: MobileContext | null = captured;
    mockStorage.seed(photo.handle, jpeg);
    request.mockImplementation(async operation => {
      if (operation === changedAfter) current = { ...captured, participant: { ...captured.participant, participant_id: "par_foreign01" } };
      return uploaded(operation) as never;
    });
    await expect(createNativePhotoPort(api, () => current, () => "synthetic-media-key-0001").prepare!(photo, captured)).rejects.toThrow(/owner changed/);
    expect(request).toHaveBeenCalledTimes(["reserveMediaUpload", "uploadMediaContent", "completeMediaUpload"].indexOf(changedAfter) + 1);
    expect(request.mock.calls[0]?.[2]?.scope?.signal.aborted).toBe(true);
  });
test.each(["offline", "stale", "missing-permission", "new-generation"] as const)("%s denies upload before any API effect", async reason => {
  const { api, request } = instrument(); const captured = onlineMediaContext(); let current = captured;
  if (reason === "offline") current = { ...captured, online: false };
  if (reason === "stale") current = { ...captured, freshness: "stale" };
  if (reason === "missing-permission") current = { ...captured, participant: { ...captured.participant, permissions: [] } };
  if (reason === "new-generation") current = { ...captured, session: { ...captured.session, generation: captured.session.generation + 1 } };
  await expect(createNativePhotoPort(api, () => current, () => "synthetic-media-key-0001").prepare!(photo, captured)).rejects.toThrow(/Refresh authorized media scope/);
  expect(request).not.toHaveBeenCalled();
});
test("failed normalization never returns the reserved upload ID as usable report media", async () => {
  const { api, request } = instrument(); const current = onlineMediaContext(); mockStorage.seed(photo.handle, jpeg);
  request.mockImplementation(async operation => {
    if (operation === "completeMediaUpload") throw new Error("Synthetic normalization failure");
    return uploaded(operation) as never;
  });
  await expect(createNativePhotoPort(api, () => current, () => "synthetic-media-key-0001").prepare!(photo, current)).rejects.toThrow(/normalization failure/);
  expect(request.mock.calls[0]?.[2]?.scope?.signal.aborted).toBe(true);
});

test("principal switch during a deferred file read performs no media request under the new bearer", async () => {
  const { api, request } = instrument(); const captured = onlineMediaContext(); let current: MobileContext | null = captured;
  mockStorage.seed(photo.handle, jpeg); const gate = deferred(); mockStorage.bytesGate = gate.promise;
  const preparing = createNativePhotoPort(api, () => current, () => "synthetic-media-key-0001").prepare!(photo, captured);
  current = { ...captured, participant: { ...captured.participant, participant_id: "par_other001" } };
  gate.resolve(); await expect(preparing).rejects.toThrow(/owner changed/); expect(request).not.toHaveBeenCalled();
});
