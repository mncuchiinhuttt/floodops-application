import { afterEach, describe, expect, it } from "vitest";
import { reset, runInDurableObject, evictDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { bindings, command, create, invite, mutateSnapshot, requestKey, rpc, type Fixture } from "../capabilities/helpers";
afterEach(reset);
const reportId = "report_report01";
const advice = { quality_ratings: { sharpness: 1, lighting: 2, scene_visibility: 1, detail: 2 }, quality_score: 75,
  visible_summary: "Synthetic review fixture", report_match: "yes", mismatch_notes: [], reasons: ["Synthetic detail"], recommendation: "looks_consistent" };
async function reserve(f: Fixture, key = requestKey()) { return rpc(f, { kind: "image-reserve", name: reportId, key, path: `/reports/${reportId}/image-review-jobs`, payload: {} }); }
async function begin(f: Fixture) {
  const result = await reserve(f); if (result.status !== 202 || !result.effect) throw new Error(`Reserve failed ${result.status}`);
  const job = parseSchema("ImageReviewJob", result.body.data);
  const payload = { job_id: job.job_id, lease: result.effect.lease };
  const started = await rpc(f, { kind: "image-start", name: reportId, payload });
  if (started.status !== 200) throw new Error(`Start failed ${started.status}`);
  return { job, payload };
}
describe("durable image metadata, no provider", () => {
  it("reuses current input across keys without a second lease/call", async () => {
    const f = await create(); const key = requestKey(); const first = await reserve(f, key); const second = await reserve(f, key); const third = await reserve(f);
    expect(first.status).toBe(202); expect(second.effect).toBeUndefined(); expect(third.effect).toBeUndefined();
    expect(parseSchema("ImageReviewJob", first.body.data).job_id).toBe(parseSchema("ImageReviewJob", third.body.data).job_id);
    expect((await rpc(f, {})).body.meta.revision).toBe(0);
  });
  it("publishes completed advice at unchanged revision and keeps it after deadline", async () => {
    const f = await create(); const { payload } = await begin(f);
    expect((await rpc(f, { kind: "image-complete", name: reportId, payload: { ...payload, result: advice } })).status).toBe(200);
    await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
      const row = state.storage.sql.exec<{ id: string; value: string }>("SELECT id,value FROM documents WHERE collection='image_jobs'").one();
      const r = JSON.parse(row.value); r.job.deadline_at = new Date(Date.now() - 100).toISOString(); r.leaseExpires = Date.now() - 100;
      state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='image_jobs' AND id=?", JSON.stringify(r), row.id);
    });
    const read = await rpc(f, { kind: "image-read", name: reportId }); expect(read.status).toBe(200);
    const state = parseSchema("ImageReviewState", read.body.data); expect(state.job?.status).toBe("completed"); expect(state.job?.result?.quality_score).toBe(75);
    expect(read.body.meta.revision).toBe(0); expect(read.body.meta.event_sequence).toBe(3);
    expect((await reserve(f)).effect).toBeUndefined();
  });
  it("times out abandoned running jobs after eviction and permits only explicit retry", async () => {
    const f = await create(); const { payload } = await begin(f);
    await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
      const row = state.storage.sql.exec<{ id: string; value: string }>("SELECT id,value FROM documents WHERE collection='image_jobs'").one();
      const r = JSON.parse(row.value); r.leaseExpires = Date.now() - 1;
      state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='image_jobs' AND id=?", JSON.stringify(r), row.id);
    });
    await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)));
    const read = await rpc(f, { kind: "image-read", name: reportId }); const job = parseSchema("ImageReviewState", read.body.data).job!;
    expect(job.status).toBe("failed"); expect(job.result).toBeNull(); expect(job.error_code).toBe("MODEL_TIMEOUT");
    expect((await rpc(f, { kind: "image-complete", name: reportId, payload: { ...payload, result: advice } })).status).toBe(409);
    expect((await reserve(f)).effect !== undefined).toBe(true);
  });
  it("fences late advice after manual review and still replays the original request", async () => {
    const f = await create(); const key = requestKey(); const reserved = await reserve(f, key); const job = parseSchema("ImageReviewJob", reserved.body.data);
    const payload = { job_id: job.job_id, lease: reserved.effect!.lease };
    await rpc(f, { kind: "image-start", name: reportId, payload });
    expect((await command(f, 0, requestKey(), f.etag, "review")).status).toBe(200);
    expect((await rpc(f, { kind: "image-complete", name: reportId, payload: { ...payload, result: advice } })).status).toBe(409);
    const state = parseSchema("ImageReviewState", (await rpc(f, { kind: "image-read", name: reportId })).body.data);
    expect(state.job?.status).toBe("superseded"); expect(state.job?.result).toBeNull();
    expect((await reserve(f, key)).status).toBe(202); expect((await reserve(f)).status).toBe(409);
  });
  it("preserves unchanged input during unrelated revision/advancing state", async () => {
    const f = await create(); const { payload } = await begin(f);
    await command(f, 1);
    await mutateSnapshot(f, s => { s.meta.status = "advancing"; });
    expect((await rpc(f, { kind: "image-complete", name: reportId, payload: { ...payload, result: advice } })).status).toBe(200);
  });
  it("keeps AI metadata dispatcher-only and enforces call budget", async () => {
    const f = await create(); const contributor = await invite(f, "contributor"); await begin(f);
    expect((await rpc(contributor, { kind: "image-read", name: reportId })).status).toBe(403);
    const events = await rpc(contributor, { kind: "events", after: 0, limit: 500 }); const page = parseSchema("EventPage", events.body.data);
    expect(page.events.some(e => e.type === "image_review_changed")).toBe(false); expect(page.next_sequence).toBe(2);
    await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
      state.storage.sql.exec("UPDATE documents SET value='50' WHERE collection='runtime' AND id='image_calls'");
      const row = state.storage.sql.exec<{ id: string; value: string }>("SELECT id,value FROM documents WHERE collection='image_jobs'").one();
      const r = JSON.parse(row.value); r.job.status = "failed"; r.job.error_code = "MODEL_TIMEOUT"; r.job.completed_at = new Date().toISOString();
      state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='image_jobs' AND id=?", JSON.stringify(r), row.id);
    });
    expect((await reserve(f)).status).toBe(429);
  });
  it("rejects mismatched advice fields without publishing a result", async () => {
    const f = await create(); const { payload } = await begin(f);
    expect((await rpc(f, { kind: "image-complete", name: reportId, payload: { ...payload, result: { ...advice, quality_score: 100 } } })).status).toBe(422);
    const job = parseSchema("ImageReviewState", (await rpc(f, { kind: "image-read", name: reportId })).body.data).job!;
    expect(job.status).toBe("running"); expect(job.result).toBeNull();
  });
});
