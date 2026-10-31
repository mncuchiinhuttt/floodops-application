import { afterEach, expect, it } from "vitest";
import { reset, evictDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { sourceReview, ports } from "./review-adapter-worker";
import { accept, bindings, call, citizen, client, clock, createV2, current, headers, join, key, ready,
  rewards, sessionContext, snapshot, sources, submit, transitionContext } from "./review-adapter-fixtures";
afterEach(reset);
it("real v2 upload/submit/review preserves original actor, capture receipt, simulator and unrelated values", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const report = await submit(contributor, citizen(media.media_id)); expect(report.status).toBe("pending_review");
  const before = await snapshot(owner), receipt = sources(before).reports[report.report_id]!, run = ports.simulationPersistence.read(before.values);
  expect(before.meta.scenario_version).toBe("2");
  const original = sourceReview.reportContext(await transitionContext(owner, before), report);
  expect(original.participant.participant_id).toBe(contributor.participant); expect(original.participant.role).toBe("contributor");
  expect(original.receivedAt).toBe(report.received_at); expect(original.epochs).toEqual(receipt.capturedEpochs);
  expect(original.media).toMatchObject({ normalized: true, duplicate: false });
  const response = await accept(owner, report.report_id); expect(response.status).toBe(200);
  const result = parseSchema("ReportReviewResultResponse", await response.json()).data!;
  expect(result.report).toMatchObject({ status: "accepted", participant_id: contributor.participant, reporter_entity_id: "contributor_functional1" });
  expect(result.observations).toHaveLength(1); expect(result.observations[0]).toMatchObject({ source_id: "src_citizen1", vehicle_types: ["motorbike"],
    confidence_band: "low", observed_sim_minute: 0, expires_sim_minute: 3 });
  const after = await snapshot(owner), saved = sources(after).reports[report.report_id]!, changed = ports.simulationPersistence.read(after.values);
  expect(after.meta.revision).toBe(before.meta.revision + 1); expect(after.values.adapterSentinel).toEqual(before.values.adapterSentinel);
  expect(after.values.reviewRewardsSeed).toEqual(before.values.reviewRewardsSeed); expect(sources(after).uploads).toEqual(sources(before).uploads);
  for (const branch of ["static", "floodops", "reroute_only"] as const) expect(changed.branches[branch]?.operations).toEqual(run.branches[branch]?.operations);
  expect(changed.scenario).toEqual(run.scenario); expect(changed.nowMs).toBe(run.nowMs);
  expect(changed.knowledge.find(pair => pair.segment_id === "seg_edge27" && pair.vehicle_type === "car")?.state).toBe("ordinary_unknown");
  expect(saved.originalSubmitter).toEqual(receipt.originalSubmitter); expect(saved.capturedEpochs).toEqual(receipt.capturedEpochs);
  expect(saved.normalizedDigest).toBe(media.sha256); expect(result.award?.points).toBe(7); expect(result.award?.is_simulated).toBe(true);
  expect(rewards(after)?.audit[0]?.actor_id).toBe(owner.participant); expect(saved.report.award_id).toBe(result.award?.award_id);
  await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)));
  expect(rewards(await snapshot(owner))?.ledger.awards).toHaveLength(1);
});
it("review replay precedes stale CAS; unrelated current revision does not rewrite original capture TTL", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const report = await submit(contributor, citizen(media.media_id)); expect((await clock(owner, 1)).status).toBe(200);
  const expected = (await current(owner)).etag, requestKey = key(), response = await accept(owner, report.report_id, "normal", requestKey, expected);
  expect(response.status).toBe(200); const body = await response.json(), committed = await snapshot(owner);
  expect(parseSchema("ReportReviewResultResponse", body).data!.observations[0]?.expires_sim_minute).toBe(3);
  const replay = await accept(owner, report.report_id, "normal", requestKey, expected); expect(replay.status).toBe(200);
  expect(await replay.json()).toEqual(body); expect((await snapshot(owner)).values).toEqual(committed.values);
  const stale = await accept(owner, report.report_id, "normal", key(), expected); expect(stale.status).toBe(412);
});
it("a later duplicate cannot retroactively disqualify the first original receipt", async () => {
  const owner = await createV2(), first = await join(owner, "contributor", "contributor_functional1"), second = await join(owner, "contributor", "contributor_functional1");
  const a = await ready(first), original = await submit(first, citizen(a.media.media_id));
  const b = await ready(second), duplicate = await submit(second, citizen(b.media.media_id)); expect(b.media.sha256).toBe(a.media.sha256);
  expect(duplicate).toMatchObject({ status: "needs_clarification", reason_codes: ["DUPLICATE_IMAGE"], award_id: null });
  expect(sourceReview.image(await snapshot(owner), original)).toMatchObject({ ready: true, duplicate: false });
  const accepted = await accept(owner, original.report_id); expect(accepted.status).toBe(200);
  const committed = await snapshot(owner); expect(rewards(committed)?.ledger.awards).toHaveLength(1);
  expect((await accept(owner, duplicate.report_id)).status).toBe(409); expect((await snapshot(owner)).values).toEqual(committed.values);
  expect((await call(`/sessions/${owner.id}/reports/${original.report_id}`, { headers: headers(second) })).status).toBe(404);
});
it("expired capture cannot be refreshed by review and all source/reward values remain unchanged", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const report = await submit(contributor, citizen(media.media_id)); expect((await clock(owner, 3)).status).toBe(200);
  const before = await snapshot(owner), rejected = await accept(owner, report.report_id);
  expect(rejected.status).toBe(409); expect((await snapshot(owner)).values).toEqual(before.values);
  expect(rewards(before)?.ledger.awards ?? []).toEqual([]); expect(sources(before).reports[report.report_id]?.report.status).toBe("pending_review");
});
it("a real late transaction failure rolls back review, knowledge, award, audit and event sequence together", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const report = await submit(contributor, citizen(media.media_id)), before = await snapshot(owner);
  const reply = await client().dispatch({ ...sessionContext(owner), kind: "command", name: "test-review-rollback", key: key(),
    path: "test-review-rollback", ifMatch: (await current(owner)).etag, payload: { report_id: report.report_id, input: {
      decision: "accept", reason: "Actual reducer with late event fault", mapped_segment_id: null, vehicle_types: [], condition: "normal" } } });
  expect(reply.status).toBe(422); const after = await snapshot(owner);
  expect(after.values).toEqual(before.values); expect(after.meta.revision).toBe(before.meta.revision); expect(after.meta.event_sequence).toBe(before.meta.event_sequence);
});

it("two real review writers with the same current CAS commit exactly one atomic result", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const report = await submit(contributor, citizen(media.media_id)), before = await snapshot(owner), etag = (await current(owner)).etag;
  const outcomes = await Promise.all([accept(owner, report.report_id, "normal", key(), etag), accept(owner, report.report_id, "normal", key(), etag)]);
  expect(outcomes.map(item => item.status).sort()).toEqual([200, 412]);
  const after = await snapshot(owner); expect(after.meta.revision).toBe(before.meta.revision + 1);
  expect(rewards(after)?.ledger.awards).toHaveLength(1); expect(rewards(after)?.audit).toHaveLength(1);
});
it("a real incident cannot replace persisted capture epochs with the newer review epoch", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  expect((await clock(owner, 2.5)).status).toBe(200);
  const report = await submit(contributor, { ...citizen(media.media_id), captured_at: "2026-10-31T00:02:30Z", captured_sim_minute: 2.5 });
  const captured = sources(await snapshot(owner)).reports[report.report_id]!.capturedEpochs;
  expect((await clock(owner, 3.5)).status).toBe(200);
  const before = await snapshot(owner), context = await transitionContext(owner, before), original = sourceReview.reportContext(context, report);
  expect(original.epochs).toEqual(captured); expect(sourceReview.read(context).pairs.some(pair => captured.some(old => old.segment_id === pair.segment_id
    && old.vehicle_type === pair.vehicle_type && old.knowledge_epoch !== pair.knowledge_epoch))).toBe(true);
  expect((await accept(owner, report.report_id)).status).toBe(409); expect((await snapshot(owner)).values).toEqual(before.values);
});
it("contributor authentication does not grant dispatcher review permission", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const report = await submit(contributor, citizen(media.media_id)), before = await snapshot(owner);
  expect((await accept(contributor, report.report_id)).status).toBe(403); expect((await snapshot(owner)).values).toEqual(before.values);
});
