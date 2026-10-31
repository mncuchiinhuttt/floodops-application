import { afterEach, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { createSourceImageReviewMediaPort, prepareSourceReviewImage } from "../../src/features/reports/index";
import { prepareImageReviewBinding, imageContextKey } from "../../src/features/reports/review/index";
import { imageOptions, imageConfig, sourceReview, reviewRuntime } from "./review-adapter-worker";
import { accept, citizen, client, createV2, join, key, ready, resetSession, sessionContext, snapshot, sources, submit, bindings } from "./review-adapter-fixtures";
afterEach(reset);
it("prepares and persists the exact normalized-image binding without changing operational revision, then fences late advice after manual Accept", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const report = await submit(contributor, citizen(media.media_id)), before = await snapshot(owner), context = sessionContext(owner);
  const prepared = await prepareSourceReviewImage(bindings, imageOptions, context, report.report_id), after = await snapshot(owner);
  const image = sourceReview.image(after, report)!; expect(image).toMatchObject({ ready: true, duplicate: false, normalized_hash: media.sha256 });
  expect(image.prepared).toEqual(prepared); expect(prepared.context_key).toBe(imageContextKey(after.meta, report, image, imageConfig));
  const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(prepared.context_key)))].map(value => value.toString(16).padStart(2, "0")).join("");
  expect(prepared.input_digest).toBe(digest); expect(after.meta.revision).toBe(before.meta.revision);
  expect(after.values.simulation).toEqual(before.values.simulation); expect(sources(after)).toEqual(sources(before));
  expect(reviewRuntime.registry.imageBinding!(after, report.report_id)?.pending).toBe(true);
  const metadata = client().imageReview, reserved = await metadata.reserve(context, report.report_id, key());
  expect(reserved.status).toBe(202); expect(reserved.effect).toBeDefined();
  const job = parseSchema("ImageReviewJob", reserved.body.data), lease = reserved.effect!.lease;
  expect((await metadata.start(context, report.report_id, job.job_id, lease)).status).toBe(200);
  expect((await accept(owner, report.report_id)).status).toBe(200);
  const committed = await snapshot(owner), accepted = sourceReview.report(committed, report.report_id)!;
  expect(sourceReview.image(committed, accepted)?.ready).toBe(true); expect(reviewRuntime.registry.imageBinding!(committed, report.report_id)?.pending).toBe(false);
  expect((await metadata.complete(context, report.report_id, job.job_id, lease, { error_code: "MODEL_TIMEOUT" })).status).toBe(409);
  const state = parseSchema("ImageReviewState", (await metadata.read(context, report.report_id)).body.data);
  expect(state.job?.status).toBe("superseded"); expect(state.job?.result).toBeNull(); expect((await snapshot(owner)).values).toEqual(committed.values);
});
it("a human decision during real asynchronous image preparation prevents stale metadata attachment", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const report = await submit(contributor, citizen(media.media_id));
  let release!: () => void, start!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; }), entered = new Promise<void>(resolve => { start = resolve; });
  const options = { ...imageOptions, async prepare(...args: Parameters<typeof prepareImageReviewBinding>) { start(); await gate; return prepareImageReviewBinding(...args); } };
  const pending = prepareSourceReviewImage(bindings, options, sessionContext(owner), report.report_id);
  const refused = expect(pending).rejects.toMatchObject({ status: 409 }); await entered;
  expect((await accept(owner, report.report_id)).status).toBe(200); const committed = await snapshot(owner); release(); await refused;
  expect((await snapshot(owner)).values).toEqual(committed.values); expect(sourceReview.image(committed, sourceReview.report(committed, report.report_id)!)?.prepared).toBeUndefined();
});
it("actual Reset during image preparation refuses the old generation and leaves replacement reports and ledger empty", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const report = await submit(contributor, citizen(media.media_id));
  let release!: () => void, start!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; }), entered = new Promise<void>(resolve => { start = resolve; });
  const options = { ...imageOptions, async prepare(...args: Parameters<typeof prepareImageReviewBinding>) { start(); await gate; return prepareImageReviewBinding(...args); } };
  const pending = prepareSourceReviewImage(bindings, options, sessionContext(owner), report.report_id);
  const refused = expect(pending).rejects.toMatchObject({ status: 410 }); await entered;
  const response = await resetSession(owner); expect(response.status).toBe(201);
  const replacement = parseSchema("ResetResultResponse", await response.json()).data!.replacement;
  release(); await refused;
  const fresh = { ...owner, id: replacement.session.session_id, token: replacement.credential.access_token!, participant: replacement.participant.participant_id };
  const state = await snapshot(fresh); expect(state.meta.generation).toBe(1); expect(sources(state).reports).toEqual({});
  expect(state.values.reviewRewards).toBeUndefined(); expect(sourceReview.report(state, report.report_id)).toBeNull();
});

it("the Review media port returns actual private normalized bytes bound to the persisted job, rejecting caller or config substitutions", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const report = await submit(contributor, citizen(media.media_id)), context = sessionContext(owner);
  await prepareSourceReviewImage(bindings, imageOptions, context, report.report_id);
  const reserved = await client().imageReview.reserve(context, report.report_id, key()); expect(reserved.status).toBe(202);
  const job = parseSchema("ImageReviewJob", reserved.body.data), port = createSourceImageReviewMediaPort(bindings, imageOptions);
  const image = await port.read(context, job, new AbortController().signal);
  expect(image.normalized_hash).toBe(media.sha256); expect(image.input_digest).toBe(job.input_digest); expect(image.bytes.byteLength).toBe(media.byte_length);
  const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(image.bytes)))].map(value => value.toString(16).padStart(2, "0")).join("");
  expect(digest).toBe(media.sha256); expect(image.description).toBe(report.description); expect(image).not.toHaveProperty("rawKey");
  await expect(port.read(context, { ...job, input_digest: "a".repeat(64) }, new AbortController().signal)).rejects.toMatchObject({ status: 409 });
  await expect(port.read(context, { ...job, generation: job.generation + 1 }, new AbortController().signal)).rejects.toMatchObject({ status: 409 });
  const changed = createSourceImageReviewMediaPort(bindings, { ...imageOptions, config: { ...imageConfig, prompt_version: "changed" } });
  await expect(changed.read(context, job, new AbortController().signal)).rejects.toMatchObject({ status: 409 });
  const aborted = new AbortController(); aborted.abort(); await expect(port.read(context, job, aborted.signal)).rejects.toBeDefined();
  await expect(port.read(sessionContext(contributor), job, new AbortController().signal)).rejects.toMatchObject({ status: 403 });
});

it("the synchronous source reducer rejects a forged SHA even with the exact current public context key", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const report = await submit(contributor, citizen(media.media_id)), before = await snapshot(owner), image = sourceReview.image(before, report)!;
  const prepared = await prepareImageReviewBinding(before.meta, report, image, imageConfig);
  const forged = { ...prepared, input_digest: `${prepared.input_digest[0] === "0" ? "1" : "0"}${prepared.input_digest.slice(1)}` };
  const reply = await client().dispatch({ ...sessionContext(owner), kind: "command", name: "source-review-image-prepare", key: key(),
    path: "test-forged-source-binding", payload: { generation: before.meta.generation, report, prepared: forged } });
  expect(reply.status).toBe(409); expect((await snapshot(owner)).values).toEqual(before.values);
});
