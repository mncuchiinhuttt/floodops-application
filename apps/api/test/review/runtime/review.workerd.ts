import { afterEach, expect, it } from "vitest";
import { reset, evictDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { create, review, snapshot, domain, key, responseEtag, clock, auth, invite, request, rpc, fixture, stub, contributorA, contributorB } from "./runtime-fixtures";
import { reportA, reportB, reportDriver } from "./source-fixture";

afterEach(reset);
it("real HTTP acceptance atomically persists report, per-vehicle knowledge, gap, one award and exact replay", async () => {
  const owner = await create(), before = await snapshot(owner), requestKey = key();
  const first = await review(owner, reportA, { key: requestKey }); expect(first.response.status).toBe(200);
  const result = parseSchema("ReportReviewResultResponse", first.body).data!;
  expect(result.report.status).toBe("accepted"); expect(result.award?.points).toBe(7); expect(result.filled_gap_ids).toHaveLength(1);
  expect(result.observations).toHaveLength(1); expect(result.observations[0]?.vehicle_types).toEqual(["motorbike"]);
  const committed = await snapshot(owner), state = domain(committed);
  expect(committed.meta.revision).toBe(before.meta.revision + 1);
  expect(state.rewards?.ledger.awards).toHaveLength(1); expect(state.rewards?.audit).toHaveLength(1);
  console.info("review-runtime-smoke", JSON.stringify({ report_status: result.report.status,
    revision_delta: committed.meta.revision - before.meta.revision, awards: state.rewards?.ledger.awards.length,
    points: result.award?.points, filled_gaps: result.filled_gap_ids.length, fixture: "genuine-source-adapter-arranged-m1-records-real-sqlite-do" }));
  expect(state.source.reports.find(report => report.report_id === reportA)?.award_id).toBe(result.award?.award_id);
  expect(state.source.run.knowledge.find(pair => pair.segment_id === "seg_edge27" && pair.vehicle_type === "motorbike")?.state).toBe("known");
  expect(state.source.run.knowledge.find(pair => pair.segment_id === "seg_edge27" && pair.vehicle_type === "car")?.state).toBe("ordinary_unknown");
  const replay = await review(owner, reportA, { key: requestKey }); expect(replay.response.status).toBe(200);
  expect(parseSchema("ReportReviewResultResponse", replay.body).data).toEqual(result);
  expect((await snapshot(owner)).values).toEqual(committed.values);
  await evictDurableObject(stub(owner)); expect(domain(await snapshot(owner)).rewards?.ledger.awards).toHaveLength(1);
});
it("distinct review keys racing the same CAS produce one commit and one revision mismatch", async () => {
  const owner = await create();
  const results = await Promise.all([review(owner, reportA), review(owner, reportB)]);
  expect(results.map(value => value.response.status).sort()).toEqual([200, 412]);
  const state = domain(await snapshot(owner)); expect(state.rewards?.ledger.awards).toHaveLength(1);
  expect(state.source.reports.filter(report => report.status === "accepted")).toHaveLength(1);
  expect(state.rewards?.audit).toHaveLength(1);
});
it("same normalized synthetic photo across contributor identities cannot award or accept twice", async () => {
  const owner = await create(), first = await review(owner);
  expect(first.response.status).toBe(200); const committed = await snapshot(owner);
  const duplicate = await review(owner, reportB, { etag: responseEtag(first) });
  expect(duplicate.response.status).toBe(422); expect(parseSchema("ErrorResponse", duplicate.body).error?.code).toBe("DUPLICATE_IMAGE");
  const after = await snapshot(owner); expect(after.values).toEqual(committed.values); expect(after.meta.revision).toBe(committed.meta.revision);
  expect(domain(after).source.reports.find(report => report.report_id === reportB)?.status).toBe("pending_review");
});
it("real public clock advance makes old capture ineligible without refreshing TTL on review", async () => {
  const owner = await create(), advanced = await clock(owner, 3); expect(advanced.status).toBe(200);
  const etag = advanced.headers.get("ETag")!; const before = await snapshot(owner);
  const result = await review(owner, reportA, { etag }); expect(result.response.status).toBe(409);
  expect((await snapshot(owner)).values).toEqual(before.values); expect(domain(before).rewards?.ledger.awards ?? []).toEqual([]);
});
it("field roles cannot review/read awards; contributor dashboards include only their entity reports/points", async () => {
  const owner = await create(), a = await invite(owner, "contributor", contributorA), b = await invite(owner, "contributor", contributorB);
  for (const member of [a, b, await invite(owner, "viewer"), await invite(owner, "driver")]) {
    expect((await review(member)).response.status).toBe(403);
    expect((await request(`/sessions/${owner.id}/awards`, { headers: auth(member) })).status).toBe(403);
  }
  expect((await review(owner)).response.status).toBe(200);
  const dashboardA = parseSchema("ContributorDashboardResponse", await (await request(`/sessions/${owner.id}/contributors/me`, { headers: auth(a) })).json()).data!;
  const dashboardB = parseSchema("ContributorDashboardResponse", await (await request(`/sessions/${owner.id}/contributors/me`, { headers: auth(b) })).json()).data!;
  expect(dashboardA.points_total).toBe(7); expect(dashboardA.own_reports.map(report => report.report_id)).toEqual([reportA]);
  expect(dashboardB.points_total).toBe(0); expect(dashboardB.own_reports.map(report => report.report_id)).toEqual([reportB]);
});
it("metadata-only Reject requires CAS, preserves revision and exact replay, and grants no award", async () => {
  const owner = await create(), before = await snapshot(owner), requestKey = key();
  const rejected = await review(owner, reportA, { key: requestKey, decision: "reject" });
  expect(rejected.response.status).toBe(200);
  const result = parseSchema("ReportReviewResultResponse", rejected.body).data!;
  expect(result.report.status).toBe("rejected"); expect(result.report.review_result_id).not.toBeNull(); expect(result.award).toBeNull();
  const after = await snapshot(owner); expect(after.meta.revision).toBe(before.meta.revision);
  expect(domain(after).source.run).toEqual(domain(before).source.run);
  const replay = await review(owner, reportA, { key: requestKey, decision: "reject" });
  expect(replay.body).toEqual(rejected.body);
});
it("real Reset fences old review/capability and initializes fresh generation with empty reward ledger", async () => {
  const owner = await create(), accepted = await review(owner); expect(accepted.response.status).toBe(200);
  const response = await request(`/sessions/${owner.id}/resets`, { method: "POST", headers: auth(owner,
    { "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": responseEtag(accepted) }),
    body: JSON.stringify({ client_type: "native", confirm: true }) });
  expect(response.status).toBe(201);
  const replacement = fixture(parseSchema("ResetResultResponse", await response.json()).data!.replacement);
  expect(replacement.created.session.generation).toBe(1); expect(replacement.id).not.toBe(owner.id);
  expect((await rpc(owner)).status).toBe(410); expect((await review(owner)).response.status).toBe(410);
  const fresh = await snapshot(replacement); expect(domain(fresh).rewards?.ledger.awards ?? []).toEqual([]);
  expect(domain(fresh).source.reports.every(report => report.status === "pending_review")).toBe(true);
  expect((await review(replacement)).response.status).toBe(200); expect(domain(await snapshot(replacement)).rewards?.ledger.awards).toHaveLength(1);
});

it("genuine driver/citizen conflict opens a new gap; HTTP resolution awards the citizen exactly once", async () => {
  const owner = await create(), pendingDriver = domain(await snapshot(owner)).source.reports.find(report => report.report_id === reportDriver);
  expect(pendingDriver?.status).toBe("pending_review");
  expect(pendingDriver?.review_result_id).toBeNull(); expect(pendingDriver?.observation_ids).toEqual([]);
  expect(pendingDriver?.award_id).toBeNull();
  const driver = await review(owner, reportDriver, { condition: "impassable" });
  expect(driver.response.status).toBe(200);
  const driverResult = parseSchema("ReportReviewResultResponse", driver.body).data!;
  expect(driverResult.award).toBeNull(); expect(driverResult.filled_gap_ids).toHaveLength(1);
  const citizen = await review(owner, reportA, { etag: responseEtag(driver), condition: "normal" });
  expect(citizen.response.status).toBe(200);
  const citizenResult = parseSchema("ReportReviewResultResponse", citizen.body).data!;
  expect(citizenResult.report.status).toBe("accepted"); expect(citizenResult.award).toBeNull(); expect(citizenResult.filled_gap_ids).toEqual([]);
  const conflicted = domain(await snapshot(owner)), conflict = conflicted.source.conflicts.find(item => item.status === "unresolved"
    && item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike");
  expect(conflict).toBeDefined(); expect(conflicted.rewards?.ledger.awards).toHaveLength(0);
  expect(conflicted.rewards?.ledger.gaps.some(gap => gap.status === "open" && gap.segment_id === "seg_edge27" && gap.vehicle_type === "motorbike")).toBe(true);
  const requestKey = key(), driverObservationIds = driverResult.observations.map(item => item.observation_id);
  const input = { keep_observation_ids: conflict!.observation_ids.filter(id => !driverObservationIds.includes(id)),
    supersede_observation_ids: driverObservationIds, reason: "Dispatcher keeps the synthetic citizen evidence" };
  expect(citizenResult.observations.every(item => input.keep_observation_ids.includes(item.observation_id))).toBe(true);
  const resolve = () => request(`/sessions/${owner.id}/conflicts/${conflict!.conflict_id}/resolutions`, { method: "POST",
    headers: auth(owner, { "Content-Type": "application/json", "Idempotency-Key": requestKey, "If-Match": responseEtag(citizen) }), body: JSON.stringify(input) });
  const response = await resolve(), responseBody = await response.json();
  expect(response.status, JSON.stringify(responseBody)).toBe(200);
  const result = parseSchema("ConflictResolutionResultResponse", responseBody).data!;
  expect(result.conflict.status).toBe("resolved"); expect(result.awards).toHaveLength(1); expect(result.awards[0]?.points).toBe(7);
  expect(result.awards[0]?.report_id).toBe(reportA); expect(result.awards[0]?.review_result_id).toBe(citizenResult.report.review_result_id);
  expect(result.filled_gap_ids).toHaveLength(1);
  const committed = await snapshot(owner), committedReport = domain(committed).source.reports.find(report => report.report_id === reportA);
  expect(domain(committed).rewards?.ledger.awards).toHaveLength(1);
  expect(committedReport?.review_result_id).toBe(citizenResult.report.review_result_id);
  expect(committedReport?.reviewed_at).toBe(citizenResult.report.reviewed_at);
  expect(domain(committed).source.run.sourceSnapshot.observations.find(item => item.observation_id === driverResult.observations[0]?.observation_id)?.validation).toBe("superseded");
  const replay = await resolve(); expect(replay.status).toBe(200);
  expect(parseSchema("ConflictResolutionResultResponse", await replay.json()).data).toEqual(result);
  expect((await snapshot(owner)).values).toEqual(committed.values);
});

it("clock expiry opens a new actual gap occurrence and preserves earned points", async () => {
  const owner = await create(), accepted = await review(owner); expect(accepted.response.status).toBe(200);
  const before = domain(await snapshot(owner)).rewards!.ledger;
  const advanced = await clock(owner, 6, responseEtag(accepted)); expect(advanced.status).toBe(200);
  const after = domain(await snapshot(owner)).rewards!.ledger;
  expect(after.awards).toEqual(before.awards);
  const gaps = after.gaps.filter(gap => gap.segment_id === "seg_edge27" && gap.vehicle_type === "motorbike");
  expect(gaps.map(gap => gap.status)).toEqual(["filled", "open"]);
  expect(gaps[0]!.gap_id).not.toBe(gaps[1]!.gap_id);
  expect(gaps[1]!.knowledge_epoch).toBe(1);
});
