import { afterEach, describe, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { boundedBytes, normalizeImage } from "../../src/features/media/index";
import { bindings, call, create, headers, key, png, put, ready, reserve } from "./helpers";
import { animatedPng, dimensionPng, metadataPng, orientedJpeg } from "./image-fixtures";
afterEach(reset);
describe("actual image limits and metadata stripping", () => {
  it("strips PNG metadata after real decode/reencode", async () => {
    const owner = await create(), original = metadataPng(), { media } = await ready(owner, original);
    const bytes = new Uint8Array(await (await call(`/sessions/${owner.id}/media/${media.media_id}`, { headers: headers(owner) })).arrayBuffer());
    expect(new TextDecoder().decode(original)).toContain("synthetic-GPS"); expect(new TextDecoder().decode(bytes)).not.toContain("synthetic-GPS");
    expect(await bindings.IMAGES!.info(new Blob([bytes]).stream())).toMatchObject({ width:64,height:48 });
  });
  it("normalizes an actual orientation6 mobile JPEG and strips EXIF", async () => {
    const owner = await create(), jpeg = await orientedJpeg(), { media } = await ready(owner,jpeg,"image/jpeg");
    expect(media).toMatchObject({ width:48,height:64,content_type:"image/jpeg" });
    const bytes = new Uint8Array(await (await call(`/sessions/${owner.id}/media/${media.media_id}`, { headers:headers(owner) })).arrayBuffer());
    expect(new TextDecoder().decode(jpeg)).toContain("Exif"); expect(new TextDecoder().decode(bytes)).not.toContain("Exif");
    expect(await bindings.IMAGES!.info(new Blob([bytes]).stream())).toMatchObject({ width:48,height:64 });
  });
  it("bounds actual streamed bytes, independent of Content-Length, and cancels oversized streams", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array(5_242_880)); controller.enqueue(new Uint8Array([1])); }, cancel() { cancelled = true; } });
    await expect(boundedBytes(stream)).rejects.toMatchObject({ status:413,code:"IMAGE_TOO_LARGE" }); expect(cancelled).toBe(true);
    const owner = await create(), upload = await reserve(owner);
    const response = await call(`/sessions/${owner.id}/media-uploads/${upload.upload_id}/content`, { method:"PUT",
      headers:headers(owner,{ "Content-Type":"application/octet-stream","Idempotency-Key":key() }),body:new Uint8Array(5_242_881) });
    expect(response.status).toBe(413);
  });
  it("rejects dimension bombs, APNG and malformed CRC before serving", async () => {
    const owner = await create();
    for (const [bytes,status] of [[dimensionPng(4097),413],[animatedPng(),422]] as const) {
      const upload = await reserve(owner,bytes); expect((await put(owner,upload,bytes)).status).toBe(status);
    }
    const malformed = png(); malformed[40] = malformed[40]! ^ 1; const upload = await reserve(owner,malformed); expect((await put(owner,upload,malformed)).status).toBe(422);
  });
  it("reports absent or broken decoder as service unavailable, without a raw fallback", async () => {
    await expect(normalizeImage(undefined,png(),"image/png")).rejects.toMatchObject({ status:503,code:"MEDIA_PROCESSING_UNAVAILABLE" });
    const broken = { info:async () => { throw new Error("synthetic decoder outage"); } } as unknown as ImagesBinding;
    await expect(normalizeImage(broken,png(),"image/png")).rejects.toMatchObject({ status:503,code:"MEDIA_PROCESSING_UNAVAILABLE" });
  });
});
