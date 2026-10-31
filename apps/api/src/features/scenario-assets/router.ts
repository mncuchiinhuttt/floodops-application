import { Hono } from "hono";
import type { FixtureAsset } from "@floodops/contracts";
import type { AppEnv } from "../../shared/index";
import { fail } from "../../shared/index";
import { send } from "../../app/index";
import { resourceId, sha256, view } from "../scenario/index";
import { boundedBytes, imageShape } from "../media/index";
import type { MediaBindings } from "../media/index";
export function createScenarioAssetsRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  router.get("/sessions/:session_id/fixture-assets/:asset_id", async c => {
    const reply = await view(c, "source-fixture-assets"); if (reply.status >= 400) return send(c, reply);
    const asset = (reply.body.data as FixtureAsset[]).find(item => item.asset_id === resourceId(c, "asset_id"));
    if (!asset || !asset.provenance.licence.trim()) fail(404, "NOT_FOUND");
    const bucket = (c.env as MediaBindings).SCENARIO_ASSETS; if (!bucket) fail(503, "STORAGE_UNAVAILABLE");
    const object = await bucket.get(`assets/${asset.asset_id}`); if (!object) fail(503, "STORAGE_UNAVAILABLE");
    const bytes = await boundedBytes(object.body), shape = imageShape(bytes, asset.content_type);
    if (bytes.length !== asset.byte_length || shape.width !== asset.width || shape.height !== asset.height || await sha256(bytes) !== asset.sha256) fail(503, "STORAGE_UNAVAILABLE");
    return c.newResponse(bytes, { status: 200, headers: { "Content-Type": asset.content_type, "Content-Length": String(bytes.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  });
  return router;
}
