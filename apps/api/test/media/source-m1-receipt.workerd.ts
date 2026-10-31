import { afterEach, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { assertReceiptRewardPolicyUnchanged, parseSchema } from "@floodops/contracts";
import { sourceReview, ports } from "./m1-receipt-worker";
import { call, citizen, configure, createV2, current, driverText, headers, join, key, policyA, policyB, postRaw, readReport, ready,
  resetSession, snapshot, sources, submit, transitionContext } from "./m1-receipt-fixtures";
afterEach(reset);
const missing = { status: "pending_config", policy: null, reason_code: "POLICY_NOT_CONFIGURED", award_id: null };
const awaiting = { status: "pending_review", policy: policyA, reason_code: "AWAITING_REVIEW", award_id: null };
it("real free upload/report succeeds without policy or mission and preserves null receipt after later configuration", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const input = citizen(media.media_id); expect(input).not.toHaveProperty("mission_id");
  const report = await submit(contributor, input);
  expect(report).toMatchObject({ status: "pending_review", reward: missing, award_id: null, review_result_id: null, reviewed_at: null });
  const before = await snapshot(owner), stored = sources(before).reports[report.report_id]!, original = sourceReview.reportContext(await transitionContext(owner, before), report);
  expect(original.participant.participant_id).toBe(contributor.participant); expect(original.receiptRewardPolicy ?? null).toBeNull();
  expect(original.epochs).toEqual(stored.capturedEpochs); expect(stored.normalizedDigest).toBe(media.sha256);
  const configured = await configure(owner, policyA); expect(configured.body.meta.revision).toBe(before.meta.revision);
  const persisted = await readReport(owner, report.report_id); expect(persisted.reward).toEqual(missing);
  expect(() => assertReceiptRewardPolicyUnchanged(report.reward, persisted.reward)).not.toThrow();
  const after = await snapshot(owner), context = await transitionContext(owner, after);
  expect(sourceReview.report(after, report.report_id)?.reward.policy).toBeNull();
  expect(sourceReview.reportContext(context, persisted).receiptRewardPolicy ?? null).toBeNull();
  expect(sourceReview.image(after, persisted)).toMatchObject({ ready: true, normalized_hash: media.sha256 });
  expect(sourceReview.read(context).reports.find(item => item.report_id === report.report_id)?.reward).toEqual(missing);
  expect(after.values.reviewRewards).toBeUndefined(); expect(persisted).not.toHaveProperty("points");
});
it("configured receipt clones policy A and remains pinned when the same server provider object is mutated to B", async () => {
  const owner = await createV2(); await configure(owner, policyA);
  const contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const report = await submit(contributor, citizen(media.media_id));
  expect(report).toMatchObject({ status: "pending_review", reward: awaiting, review_result_id: null, reviewed_at: null });
  const before = await snapshot(owner), receipt = sources(before).reports[report.report_id]!;
  await configure(owner, policyB);
  const persisted = await readReport(owner, report.report_id), after = await snapshot(owner);
  expect(persisted.reward.policy).toEqual(policyA); expect(persisted.reward.policy).not.toEqual(policyB);
  const original = sourceReview.reportContext(await transitionContext(owner, after), persisted);
  expect(original.receiptRewardPolicy).toEqual(policyA); expect(original.participant).toEqual(receipt.originalSubmitter);
  expect(original.epochs).toEqual(receipt.capturedEpochs); expect(original.receivedAt).toBe(report.received_at);
  expect(sources(after).reports[report.report_id]?.normalizedDigest).toBe(media.sha256);
  const later = await submit(contributor, citizen(media.media_id)); expect(later.reward.policy).toEqual(policyB);
  expect((await readReport(owner, report.report_id)).reward.policy).toEqual(policyA);
});
it("Source apply refuses policy replacement and null backfill without mutating source state or simulator", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const report = await submit(contributor, citizen(media.media_id)); await configure(owner, policyA);
  const before = await snapshot(owner), context = await transitionContext(owner, before), state = sourceReview.read(context);
  const changed = { ...report, reward: { status: "pending_review" as const, policy: policyA, reason_code: "AWAITING_REVIEW" as const, award_id: null } };
  expect(() => sourceReview.apply(context, { reports: state.reports.map(item => item.report_id === report.report_id ? changed : item),
    observations: state.evidence.observations, knowledge: state.knowledge, conflicts: state.conflicts })).toThrow();
  expect((await snapshot(owner)).values).toEqual(before.values);
  expect(ports.simulationPersistence.read(before.values).knowledge).toEqual(state.knowledge);
});
it("configured driver text is ineligible for community points while its original actor and epochs remain available", async () => {
  const owner = await createV2(); await configure(owner, policyA); const driver = await join(owner, "driver", "drv_moto01");
  const before = await snapshot(owner), report = await submit(driver, driverText()), after = await snapshot(owner);
  expect(report).toMatchObject({ status: "needs_clarification", reward: { status: "ineligible", policy: policyA, reason_code: "NOT_ELIGIBLE", award_id: null },
    award_id: null, review_result_id: null, reviewed_at: null, participant_id: driver.participant, reporter_entity_id: "drv_moto01" });
  const receipt = sources(after).reports[report.report_id]!, original = sourceReview.reportContext(await transitionContext(owner, after), report);
  expect(original.participant.role).toBe("driver"); expect(original.boundVehicleTypes).toEqual(["motorbike"]);
  expect(original.epochs).toEqual(receipt.capturedEpochs); expect(original.receiptRewardPolicy).toEqual(policyA); expect(sourceReview.image(after, report)).toBeNull();
  expect(ports.simulationPersistence.read(after.values).knowledge).toEqual(ports.simulationPersistence.read(before.values).knowledge);
  expect(after.values.reviewRewards).toBeUndefined();
});
it("driver text without configuration remains pending_config rather than inventing a policy or numeric award", async () => {
  const owner = await createV2(), driver = await join(owner, "driver", "drv_moto01"), report = await submit(driver, driverText());
  expect(report).toMatchObject({ status: "needs_clarification", reward: missing, award_id: null, review_result_id: null, reviewed_at: null });
  expect((await snapshot(owner)).values.reviewRewards).toBeUndefined();
});
it("strict client payloads cannot inject reward, policy, review authority, points or a mission", async () => {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), { media } = await ready(contributor);
  const before = await snapshot(owner);
  for (const fields of [{ reward: missing }, { receiptRewardPolicy: policyA }, { reward_policy: policyA }, { points: 7 },
    { review_result_id: "review_client0001" }, { reviewed_at: "2026-10-31T00:00:00Z" }, { mission_id: "mission_notM1_001" }]) {
    const response = await postRaw(contributor, { ...citizen(media.media_id), ...fields }); expect(response.status).toBe(422);
    expect(parseSchema("ErrorResponse", await response.json()).error.code).toBe("INVALID_SCHEMA");
  }
  expect((await snapshot(owner)).values).toEqual(before.values); expect(sources(before).reports).toEqual({});
});
it("Reset preserves old receipt isolation and a new generation receives its own policy decision", async () => {
  const owner = await createV2(); await configure(owner, policyA); const contributor = await join(owner, "contributor", "contributor_functional1");
  const { media } = await ready(contributor), oldReport = await submit(contributor, citizen(media.media_id)); expect(oldReport.reward.policy).toEqual(policyA);
  const response = await resetSession(owner); expect(response.status).toBe(201);
  const replacement = parseSchema("ResetResultResponse", await response.json()).data!.replacement;
  const fresh = { ...owner, id: replacement.session.session_id, token: replacement.credential.access_token!, participant: replacement.participant.participant_id };
  const empty = await snapshot(fresh); expect(empty.meta.generation).toBe(1); expect(sources(empty).reports).toEqual({}); expect(sourceReview.report(empty, oldReport.report_id)).toBeNull();
  const member = await join(fresh, "contributor", "contributor_functional1"), image = await ready(member), report = await submit(member, citizen(image.media.media_id));
  expect(report.reward).toEqual(missing); expect(report.review_result_id).toBeNull(); expect(report.reviewed_at).toBeNull();
});

it("real quick-driver HTTP stores pending manual review with no observation, knowledge or award side effects and exact replay", async () => {
  const owner = await createV2(); await configure(owner, policyA); const driver = await join(owner, "driver", "drv_moto01");
  const input = { kind: "driver", input_mode: "quick", quick_condition: "impassable", segment_id: "seg_edge27", coordinate: [106.701, 10.7705],
    captured_at: "2026-10-31T00:00:00Z", captured_sim_minute: 0, vehicle_types: ["motorbike"], description: "Synthetic quick report awaiting real human review" };
  const expected = (await current(driver)).etag, requestKey = key(), before = await snapshot(owner);
  const post = (payload: unknown, idempotency = requestKey) => call(`/sessions/${owner.id}/reports`, { method: "POST", headers: headers(driver, {
    "Content-Type": "application/json", "Idempotency-Key": idempotency, "If-Match": expected }), body: JSON.stringify(payload) });
  const denied = await post({ ...input, reporter_entity_id: "drv_auto01" }, key()); expect(denied.status).toBe(403);
  expect((await snapshot(owner)).values).toEqual(before.values);
  const first = await post(input); expect(first.status).toBe(201); const body = await first.json(), report = parseSchema("ReportResponse", body).data!;
  expect(report).toMatchObject({ status: "pending_review", input_mode: "quick", quick_condition: "impassable", participant_id: driver.participant,
    reporter_entity_id: "drv_moto01", observation_ids: [], award_id: null, review_result_id: null, reviewed_at: null,
    reward: { status: "ineligible", policy: policyA, reason_code: "NOT_ELIGIBLE", award_id: null } });
  const committed = await snapshot(owner), receipt = sources(committed).reports[report.report_id]!;
  expect(committed.meta.revision).toBe(before.meta.revision + 1); expect(committed.values.simulation).toEqual(before.values.simulation);
  expect(committed.values.reviewRewards).toEqual(before.values.reviewRewards); expect(receipt.sourceId).toBe("src_driver01");
  expect(receipt.originalSubmitter.participant_id).toBe(driver.participant); expect(receipt.boundVehicleTypes).toEqual(["motorbike"]);
  expect(receipt.capturedEpochs).toEqual([{ segment_id: "seg_edge27", vehicle_type: "motorbike", knowledge_epoch: 0 }]);
  const replay = await post(input); expect(replay.status).toBe(201); expect(await replay.json()).toEqual(body);
  expect((await snapshot(owner)).values).toEqual(committed.values); expect((await snapshot(owner)).meta.revision).toBe(committed.meta.revision);
  const stale = await post(input, key()); expect(stale.status).toBe(412); expect((await snapshot(owner)).values).toEqual(committed.values);
});
