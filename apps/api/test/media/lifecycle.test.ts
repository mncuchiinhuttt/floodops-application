import { afterEach, describe, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { bindings, call, complete, create, headers, join, key, png, put, ready, reserve, seedAsset } from "./helpers";
afterEach(reset);
function secure(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe("no-store"); expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("Content-Security-Policy")).toContain("object-src 'none'");
}
describe("actual private media lifecycle", () => {
  it("streams, really decodes/reencodes, computes normalized digest and serves private derivative without revision increment", async () => {
    const owner = await create("web"), { media } = await ready(owner);
    const response = await call(`/sessions/${owner.id}/media/${media.media_id}`, { headers: headers(owner) });
    expect(response.status).toBe(200); secure(response);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://floodops.test");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(bytes.length).toBe(media.byte_length);
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(value => value.toString(16).padStart(2, "0")).join("");
    expect(digest).toBe(media.sha256);
    const info = await bindings.IMAGES!.info(new Blob([bytes]).stream()); expect(info).toMatchObject({ width: 64, height: 48 });
    const identity = await call(`/sessions/${owner.id}/identity`, { headers: headers(owner) });
    expect(identity.headers.get("ETag")).toBe(owner.etag);
    expect((await bindings.REPORT_MEDIA!.list({ prefix: `sessions/${owner.id}/` })).objects.some(object => object.key.includes("/normalized/"))).toBe(true);
  });
  it("replays reserve/upload/completion exactly and rejects differing same-key bodies", async () => {
    const owner = await create(), reservationKey = key(), upload = await reserve(owner, png(), "image/png", reservationKey);
    expect((await reserve(owner, png(), "image/png", reservationKey)).upload_id).toBe(upload.upload_id);
    const uploadKey = key(), first = await put(owner, upload, png(), uploadKey); expect(first.status).toBe(200);
    const firstBody = await first.json(), replay = await put(owner, upload, png(), uploadKey); expect(replay.status).toBe(200); expect(await replay.json()).toEqual(firstBody);
    const completionKey = key(), done = await complete(owner, upload, completionKey); expect(done.status).toBe(201);
    const doneBody = await done.json(), again = await complete(owner, upload, completionKey); expect(again.status).toBe(201); expect(await again.json()).toEqual(doneBody);
    const changed = await call(`/sessions/${owner.id}/media-uploads`, { method: "POST", headers: headers(owner, { "Content-Type": "application/json", "Idempotency-Key": reservationKey }),
      body: JSON.stringify({ content_type: "image/png", byte_length: 188, original_filename: "changed.png" }) });
    expect(changed.status).toBe(409);
  });
  it("denies cross-session/owner/viewer reads and missing CSRF without exposing raw staging", async () => {
    const owner = await create("web"), contributor = await join(owner, "contributor", "contributor_functional1"), viewer = await join(owner, "viewer", null);
    const { media, upload } = await ready(contributor);
    const other = await create(); expect((await call(`/sessions/${other.id}/media/${media.media_id}`, { headers: headers(other) })).status).toBe(404);
    const secondContributor = await join(owner, "contributor", "contributor_functional1");
    expect((await call(`/sessions/${owner.id}/media/${media.media_id}`, { headers: headers(secondContributor) })).status).toBe(404);
    expect((await call(`/sessions/${owner.id}/media/${media.media_id}`, { headers: headers(viewer) })).status).toBe(403);
    expect((await call(`/sessions/${owner.id}/media-uploads/${upload.upload_id}/content`, { headers: headers(contributor) })).status).toBe(404);
    const csrf = headers(owner, { "Content-Type": "application/json", "Idempotency-Key": key() }); delete (csrf as Record<string,string>)["X-CSRF-Token"];
    expect((await call(`/sessions/${owner.id}/media-uploads`, { method: "POST", headers: csrf, body: JSON.stringify({ content_type: "image/png", byte_length: 187, original_filename: "x.png" }) })).status).toBe(403);
    const bad = await call(`/sessions/${owner.id}/media/${media.media_id}`, { headers: { ...headers(owner), Origin: "https://bad.invalid" } }); expect(bad.status).toBe(403); secure(bad);
  });
  it("serves only manifest-owned verified immutable fixture bytes and preserves bucket isolation", async () => {
    const owner = await create(); await seedAsset();
    const response = await call(`/sessions/${owner.id}/fixture-assets/asset_synthetic01`, { headers: headers(owner) }); expect(response.status).toBe(200); secure(response);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(png());
    expect((await call(`/sessions/${owner.id}/fixture-assets/asset_unknown01`, { headers: headers(owner) })).status).toBe(404);
    await bindings.SCENARIO_ASSETS!.put("assets/asset_synthetic01", new Uint8Array([1,2,3]));
    expect((await call(`/sessions/${owner.id}/fixture-assets/asset_synthetic01`, { headers: headers(owner) })).status).toBeGreaterThanOrEqual(400);
  });
  it("rejects incomplete reservation, metadata injection, SVG, MIME lies and truncated PNG", async () => {
    const owner = await create(), upload = await reserve(owner);
    expect((await complete(owner, upload)).status).toBe(409);
    for (const bytes of [new TextEncoder().encode("<svg/>"), png().slice(0,-1)]) {
      const item = await reserve(owner, bytes); expect((await put(owner, item, bytes)).status).toBe(422);
    }
    const fake = await reserve(owner, png(), "image/jpeg"); expect((await put(owner, fake)).status).toBe(422);
    const injected = await call(`/sessions/${owner.id}/media-uploads`, { method: "POST", headers: headers(owner, { "Content-Type": "application/json", "Idempotency-Key": key() }),
      body: JSON.stringify({ content_type: "image/png", byte_length: 187, original_filename: "x.png", key: "public/raw" }) }); expect(injected.status).toBe(422);
  });
});
