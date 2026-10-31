import { afterEach, expect, it } from "vitest";
import { reset, evictDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { deriveImageReviewAdvice } from "../../../src/features/reports/review/rubric/index";
import { begin, create, domain, expireImageDeadline, invite, key, reserve, review, rpc, snapshot, stub } from "./runtime-fixtures";
import { reportA, imageConfig, syntheticImageBytes } from "./source-fixture";
import { createResponsesImageReviewPort, runImageReview } from "../../../src/features/reports/review/index";
import { createSessionRuntimeClient } from "../../../src/shared/index";
import { bindings } from "./runtime-fixtures";

afterEach(reset);
const advice = deriveImageReviewAdvice({ quality_ratings: { sharpness: 1, lighting: 2, scene_visibility: 1, detail: 2 },
  visible_summary: "Synthetic image fixture", report_match: "yes", mismatch_notes: [], reasons: ["Synthetic bounded content"] });
it("real metadata reserve/start/complete changes only metadata and reuses one reservation/call", async () => {
  const owner = await create(), before = await snapshot(owner), requestKey = key();
  const reserved = await reserve(owner, reportA, requestKey); expect(reserved.status).toBe(202); expect(reserved.effect).toBeDefined();
  const sameKey = await reserve(owner, reportA, requestKey), newKey = await reserve(owner);
  expect(sameKey.effect).toBeUndefined(); expect(newKey.effect).toBeUndefined();
  const job = parseSchema("ImageReviewJob", reserved.body.data), payload = { job_id: job.job_id, lease: reserved.effect!.lease };
  expect(parseSchema("ImageReviewJob", newKey.body.data).job_id).toBe(job.job_id);
  expect((await rpc(owner, { kind: "image-start", name: reportA, payload })).status).toBe(200);
  expect((await rpc(owner, { kind: "image-complete", name: reportA, payload: { ...payload, result: advice } })).status).toBe(200);
  const state = parseSchema("ImageReviewState", (await rpc(owner, { kind: "image-read", name: reportA })).body.data);
  expect(state.job?.result?.quality_score).toBe(75); expect(state.job?.status).toBe("completed");
  const after = await snapshot(owner); expect(after.meta.revision).toBe(before.meta.revision);
  expect(after.meta.event_sequence).toBe(before.meta.event_sequence + 3); expect(after.values).toEqual(before.values);
  expect((await reserve(owner)).effect).toBeUndefined();
  await expireImageDeadline(owner); await evictDurableObject(stub(owner));
  expect(parseSchema("ImageReviewState", (await rpc(owner, { kind: "image-read", name: reportA })).body.data).job?.status).toBe("completed");
});
it("manual Accept succeeds while image job runs; late model result cannot rollback or award twice", async () => {
  const owner = await create(), { payload } = await begin(owner), accepted = await review(owner);
  expect(accepted.response.status).toBe(200); const committed = await snapshot(owner);
  expect((await rpc(owner, { kind: "image-complete", name: reportA, payload: { ...payload, result: advice } })).status).toBe(409);
  const state = parseSchema("ImageReviewState", (await rpc(owner, { kind: "image-read", name: reportA })).body.data);
  expect(state.job?.status).toBe("superseded"); expect(state.job?.result).toBeNull();
  expect((await snapshot(owner)).values).toEqual(committed.values); expect(domain(committed).rewards?.ledger.awards).toHaveLength(1);
});
it("deadline/eviction yields failed/null and only explicit new key reserves another attempt", async () => {
  const owner = await create(), { payload } = await begin(owner); await expireImageDeadline(owner); await evictDurableObject(stub(owner));
  const read = await rpc(owner, { kind: "image-read", name: reportA }), job = parseSchema("ImageReviewState", read.body.data).job!;
  expect(job.status).toBe("failed"); expect(job.error_code).toBe("MODEL_TIMEOUT"); expect(job.result).toBeNull();
  expect((await rpc(owner, { kind: "image-complete", name: reportA, payload: { ...payload, result: advice } })).status).toBe(409);
  expect((await reserve(owner)).effect).toBeDefined(); expect(domain(await snapshot(owner)).rewards).toBeUndefined();
});
it("image advice and invalidation stream stay dispatcher-only even for report entity owner", async () => {
  const owner = await create(), contributor = await invite(owner, "contributor"); await begin(owner);
  expect((await rpc(contributor, { kind: "image-read", name: reportA })).status).toBe(403);
  expect((await reserve(contributor)).status).toBe(403);
  const events = parseSchema("EventPage", (await rpc(contributor, { kind: "events", after: 0, limit: 500 })).body.data);
  expect(events.events.some(event => event.type === "image_review_changed")).toBe(false);
  expect(events.next_sequence).toBeGreaterThan(0);
  const dispatcherEvents = parseSchema("EventPage", (await rpc(owner, { kind: "events", after: 0, limit: 500 })).body.data);
  expect(dispatcherEvents.events.some(event => event.type === "image_review_changed")).toBe(true);
});
it("forbidden or inconsistent derived model fields never publish advice; manual review remains usable", async () => {
  const owner = await create(), { payload } = await begin(owner);
  for (const result of [{ ...advice, quality_score: 100 }, { ...advice, confidence: 1 }, { ...advice, points: 100 }]) {
    expect((await rpc(owner, { kind: "image-complete", name: reportA, payload: { ...payload, result } })).status).toBe(422);
  }
  expect(parseSchema("ImageReviewState", (await rpc(owner, { kind: "image-read", name: reportA })).body.data).job?.result).toBeNull();
  expect((await review(owner)).response.status).toBe(200);
});
it("queued pre-provider failure remains an explicit platform limitation, without a fake started call", async () => {
  const owner = await create(), queued = await reserve(owner); expect(queued.status).toBe(202);
  const job = parseSchema("ImageReviewJob", queued.body.data), payload = { job_id: job.job_id, lease: queued.effect!.lease, error_code: "STORAGE_UNAVAILABLE" };
  expect((await rpc(owner, { kind: "image-complete", name: reportA, payload })).status).toBe(409);
  expect(parseSchema("ImageReviewState", (await rpc(owner, { kind: "image-read", name: reportA })).body.data).job?.status).toBe("queued");
  expect((await snapshot(owner)).meta.revision).toBe(0);
});

it("actual image service uses real durable metadata and exactly one explicit fake Responses transport", async () => {
  const owner = await create(), before = await snapshot(owner), reserved = await reserve(owner);
  expect(reserved.status).toBe(202); const job = parseSchema("ImageReviewJob", reserved.body.data);
  const original = domain(before).source, metadata = original.images[reportA]!, report = original.reports.find(item => item.report_id === reportA)!;
  let calls = 0;
  const provider = createResponsesImageReviewPort({ enabled: true, apiKey: "synthetic-no-network-key", model: imageConfig.model,
    maxOutputTokens: 1000, maxImageBytes: 1024, maxResponseBytes: 8192, timeoutMs: 5000 }, async (endpoint, init) => {
    calls++; expect(String(endpoint)).toBe("https://api.openai.com/v1/responses");
    const body = JSON.parse(String(init?.body)); expect(body.model).toBe(imageConfig.model); expect(body.tools).toBeUndefined();
    expect(body.text.format.name).toBe("image_review_model_output"); expect(body.text.format.strict).toBe(true);
    expect(body.input[1].content[1].image_url.startsWith("data:image/png;base64,")).toBe(true);
    const { quality_score: _score, recommendation: _recommendation, ...modelOutput } = advice; void _score; void _recommendation;
    return Response.json({ status: "completed", output: [{ type: "message", role: "assistant", status: "completed",
      content: [{ type: "output_text", text: JSON.stringify(modelOutput) }] }] });
  });
  const result = await runImageReview({ metadata: createSessionRuntimeClient(bindings).imageReview, provider,
    media: { async read(context, expected) {
      expect(context.sessionId).toBe(owner.id); expect(expected.report_id).toBe(reportA);
      return { input_digest: job.input_digest, normalized_hash: metadata.normalized_hash, content_type: "image/png",
        bytes: syntheticImageBytes(), description: report.description };
    } } }, { sessionId: owner.id, requestId: key(), auth: { token: owner.token, transport: "bearer", origin: null, csrf: null } },
  job, reserved.effect!.lease, { normalized_hash: metadata.normalized_hash, description: report.description });
  expect(result).toBe("completed"); expect(calls).toBe(1);
  const completed = parseSchema("ImageReviewState", (await rpc(owner, { kind: "image-read", name: reportA })).body.data).job!;
  expect(completed.status).toBe("completed"); expect(completed.result?.quality_score).toBe(75);
  const after = await snapshot(owner); expect(after.values).toEqual(before.values); expect(after.meta.revision).toBe(before.meta.revision);
  expect((await reserve(owner)).effect).toBeUndefined(); expect(calls).toBe(1);
});
