import { afterEach, describe, expect, it } from "vitest";
import { reset, evictDurableObject } from "cloudflare:test";
import { parseSchema, type ImageReviewJob } from "@floodops/contracts";
import { bindings, command, create, invite, requestKey, rpc } from "../capabilities/helpers";
import { context, metadata, queued, reportId, seedCalls, stored } from "./image-fixtures";
afterEach(reset);
const errors: NonNullable<ImageReviewJob["error_code"]>[] = ["MODEL_TIMEOUT", "MODEL_REFUSED", "MODEL_INVALID_OUTPUT", "MODEL_UNAVAILABLE", "STORAGE_UNAVAILABLE"];
describe("queued prestart image failure through real durable RPC", () => {
  it.each(errors)("persists %s after restart with unchanged revision and budget", async error => {
    const f = await create(); await seedCalls(f, 9); const { job, lease } = await queued(f);
    await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)));
    const failed = await metadata.failQueued(context(f), reportId, job.job_id, lease, error);
    expect(failed.status).toBe(200); const result = parseSchema("ImageReviewJob", failed.body.data);
    expect(result.status).toBe("failed"); expect(result.result).toBeNull(); expect(result.error_code).toBe(error); expect(result.completed_at).not.toBeNull();
    expect(failed.body.meta.revision).toBe(0); expect(failed.body.meta.event_sequence).toBe(2);
    await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)));
    const read = await metadata.read(context(f), reportId); expect(parseSchema("ImageReviewState", read.body.data).job).toEqual(result);
    const saved = await stored(f); expect(saved.calls).toBe(9); expect(saved.jobs[0]!.started).toBe(false);
    expect((await metadata.failQueued(context(f), reportId, job.job_id, lease, error)).status).toBe(409);
    expect((await rpc(f, {})).body.meta.event_sequence).toBe(2);
  });
  it("charges only on a subsequent start, never refunds a started call", async () => {
    const f = await create(); await seedCalls(f, 9); const first = await queued(f);
    await metadata.failQueued(context(f), reportId, first.job.job_id, first.lease, "STORAGE_UNAVAILABLE"); expect((await stored(f)).calls).toBe(9);
    const next = await queued(f); expect((await stored(f)).calls).toBe(9);
    expect((await metadata.start(context(f), reportId, next.job.job_id, next.lease)).status).toBe(200); expect((await stored(f)).calls).toBe(10);
    expect((await metadata.failQueued(context(f), reportId, next.job.job_id, next.lease, "MODEL_UNAVAILABLE")).status).toBe(409);
    expect((await metadata.complete(context(f), reportId, next.job.job_id, next.lease, { error_code: "MODEL_UNAVAILABLE" })).status).toBe(200); expect((await stored(f)).calls).toBe(10);
  });
  it("atomically races prestart failure against start without a fake charge or refund", async () => {
    const f = await create(); const { job, lease } = await queued(f);
    const [started, failed] = await Promise.all([
      metadata.start(context(f), reportId, job.job_id, lease),
      metadata.failQueued(context(f), reportId, job.job_id, lease, "STORAGE_UNAVAILABLE"),
    ]);
    expect([started.status, failed.status].sort()).toEqual([200, 409]);
    const saved = await stored(f); expect(saved.calls).toBe(started.status === 200 ? 1 : 0);
    expect(saved.jobs[0]!.job.status).toBe(started.status === 200 ? "running" : "failed");
    expect((await rpc(f, {})).body.meta.revision).toBe(0); expect((await rpc(f, {})).body.meta.event_sequence).toBe(2);
  });
  it("keeps the failure event dispatcher-only for all other roles", async () => {
    const f = await create(); const roles = await Promise.all([invite(f, "driver"), invite(f, "contributor"), invite(f, "viewer")]);
    const { job, lease } = await queued(f); await metadata.failQueued(context(f), reportId, job.job_id, lease, "STORAGE_UNAVAILABLE");
    const events = parseSchema("EventPage", (await rpc(f, { kind: "events", after: 0, limit: 500 })).body.data).events;
    const image = events.filter(event => event.type === "image_review_changed"); expect(image).toHaveLength(2);
    expect(image.every(event => event.resource_ids.length === 2)).toBe(true);
    for (const actor of roles) {
      expect((await metadata.read(context(actor), reportId)).status).toBe(403);
      const page = parseSchema("EventPage", (await rpc(actor, { kind: "events", after: 0, limit: 500 })).body.data);
      expect(page.events.some(event => event.type === "image_review_changed")).toBe(false);
    }
  });
  it("leaves manual review possible and prevents an old callback from reviving it", async () => {
    const f = await create(); const { job, lease } = await queued(f);
    expect((await metadata.failQueued(context(f), reportId, job.job_id, lease, "MODEL_UNAVAILABLE")).status).toBe(200);
    expect((await command(f, 0, requestKey(), f.etag, "metadata-reject")).status).toBe(200);
    expect((await rpc(f, {})).body.meta.revision).toBe(0);
    expect((await metadata.start(context(f), reportId, job.job_id, lease)).status).toBe(409);
    expect((await metadata.reserve(context(f), reportId, requestKey())).status).toBe(409); expect((await stored(f)).calls).toBe(0);
  });
});
