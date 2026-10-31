import type { Snapshot } from "../../src/shared/index";
import { afterEach, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import type { ReviewStore } from "../../src/features/reports/review/index";
import { simulationPersistence } from "../../src/index";
import { sourceState } from "@floodops/domain/reporting";
import { accept, call, createV2, current, descriptionFor, filenameFor, headers, join, key, manualDecision,
  readReport, runtimeScenarios, snapshot, startImageReview, submitDriver, submitPhoto, uploadWithFilename, waitForImageState } from "./runtime-fixtures";
import type { Member } from "./runtime-fixtures";
import { scenarioCoverage } from "./scenario-corpus";

const PHOTO_CASES: Record<string, true> = { "PI-13": true, "PI-15": true, "PI-16": true, "PI-17": true, "PI-18": true, "PI-22": true };
afterEach(reset);
it("runs every runtime scenario declared exercised or partial", () => {
  const expected = runtimeScenarios.filter(item => scenarioCoverage[item.case_id]?.status !== "not-exercised").map(item => item.case_id).sort();
  expect([...Object.keys(PHOTO_CASES), "PI-12", "PI-20"].sort()).toEqual(expected);
});
function expectNoImageEffects(before: Snapshot, after: Snapshot): void {
  expect(after.meta.revision).toBe(before.meta.revision);
  expect(after.values.simulation).toEqual(before.values.simulation);
  expect(after.values.sourcesMedia).toEqual(before.values.sourcesMedia);
  expect(after.values.reviewRewards).toEqual(before.values.reviewRewards);
  const prior = simulationPersistence.read(before.values), currentRun = simulationPersistence.read(after.values);
  expect(currentRun.knowledge).toEqual(prior.knowledge);
  expect(currentRun.sourceSnapshot.observations).toEqual(prior.sourceSnapshot.observations);
}
async function expectIsolated(owner: Member, contributor: Member, other: Member, reportId: string): Promise<void> {
  const fieldRead = await call(`/sessions/${owner.id}/reports/${reportId}/image-review`, { headers: headers(contributor) });
  expect(fieldRead.status).toBe(403);
  const fieldWrite = await startImageReview(contributor, reportId);
  expect(fieldWrite.status).toBe(403);
  const foreignRead = await call(`/sessions/${other.id}/reports/${reportId}/image-review`, { headers: headers(other) });
  expect(foreignRead.status).toBeGreaterThanOrEqual(400);
}
async function uploadScenario(scenario: (typeof runtimeScenarios)[number]) {
  const owner = await createV2(), contributor = await join(owner, "contributor", "contributor_functional1"), other = await createV2();
  const filename = filenameFor(scenario), media = await uploadWithFilename(contributor, filename);
  const report = await submitPhoto(contributor, media, scenario), before = await snapshot(owner);
  const mediaState = JSON.stringify(before.values.sourcesMedia);
  expect(mediaState).not.toContain(filename); expect(report.status).toBe("pending_review");
  expect(report.description).toBe(descriptionFor(scenario)); expect(report.vehicle_types).toEqual(["motorbike"]);
  expect(report.review_result_id).toBeNull(); expect(report.reviewed_at).toBeNull(); expect(report.award_id).toBeNull();
  const ledger = before.values.reviewRewards as ReviewStore | undefined;
  expect(ledger?.ledger.awards ?? []).toHaveLength(0); expect(ledger?.audit ?? []).toHaveLength(0);
  await expectIsolated(owner, contributor, other, report.report_id);
  return { owner, contributor, other, filename, report, before };
}
for (const scenario of runtimeScenarios) if (PHOTO_CASES[scenario.case_id]) {
  it(`${scenario.case_id} photo advice keeps hostile input and model text advisory-only`, async () => {
    const { owner, other, filename, report, before } = await uploadScenario(scenario);
    if (scenario.case_id === "PI-15") {
      const invalidBody = await startImageReview(owner, report.report_id, { session_id: other.id, role: "dispatcher", confidence: 1, expires_at: "9999-01-01T00:00:00Z" });
      expect(invalidBody.status).toBe(422);
      expect(parseSchema("ErrorResponse", await invalidBody.json()).error?.code).toBe("INVALID_SCHEMA");
    }
    const started = await startImageReview(owner, report.report_id);
    if (started.status !== 202) throw new Error(`Image review start failed: ${started.status} ${await started.text()}`);
    const state = await waitForImageState(owner, report.report_id), job = state.job!;
    const after = await snapshot(owner); expectNoImageEffects(before, after);
    expect(job.status).toBe(scenario.case_id === "PI-15" || scenario.case_id === "PI-16" ? "failed" : "completed");
    if (job.status === "failed") {
      expect(job.error_code).toBe("MODEL_INVALID_OUTPUT"); expect(job.result).toBeNull();
    } else {
      const summary = `<script>untrusted OCR: ${scenario.payload}</script>`;
      expect(job.error_code).toBeNull(); expect(job.result?.visible_summary).toBe(summary);
      expect(job.result?.quality_score).toBe(75); expect(job.result?.recommendation).toBe("looks_consistent");
      expect(job.result?.visible_summary).not.toContain(filename);
      const response = await call(`/sessions/${owner.id}/reports/${report.report_id}/image-review`, { headers: headers(owner) });
      const body = await response.text();
      expect(response.headers.get("Content-Type")).toContain("application/json"); expect(body).toContain(JSON.stringify(summary));
      const encoded: unknown = JSON.parse(body), responseState = parseSchema("ImageReviewStateResponse", encoded);
      expect(responseState.data?.job?.result?.visible_summary).toBe(summary);
    }
    const currentReport = await readReport(owner, report.report_id);
    expect(currentReport.status).toBe("pending_review"); expect(currentReport.vehicle_types).toEqual(["motorbike"]);
    expect(currentReport.captured_at).toBe(report.captured_at); expect(currentReport.review_result_id).toBeNull();
    expect(currentReport.reviewed_at).toBeNull(); expect(currentReport.award_id).toBeNull();
    const reviewed = await accept(owner, report.report_id); expect(reviewed.status).toBe(200);
    const result = parseSchema("ReportReviewResultResponse", await reviewed.json()).data!;
    expect(result.report.status).toBe("accepted"); expect(result.award).toBeNull(); expect(result.report.award_id).toBeNull();
    if (scenario.case_id === "PI-17" || scenario.case_id === "PI-22") {
      expect(result.observations[0]?.vehicle_types).toEqual(["motorbike"]);
      const run = simulationPersistence.read((await snapshot(owner)).values);
      expect(run.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "car")?.state).toBe("ordinary_unknown");
    }
  });
}

it("PI-12 driver claim cannot reopen E17 or execute without dispatcher action", async () => {
  const scenario = runtimeScenarios.find(item => item.case_id === "PI-12")!;
  const owner = await createV2(), driver = await join(owner, "driver", "drv_moto01"), contributor = await join(owner, "contributor", "contributor_functional1"), other = await createV2();
  const clock = await current(owner), advanced = await call(`/sessions/${owner.id}/test-clock`, { method: "POST", headers: headers(owner,
    { "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": clock.etag }), body: JSON.stringify({ to_minute: 1 }) });
  expect(advanced.status).toBe(200);
  const afterClock = await snapshot(owner), closed = simulationPersistence.read(afterClock.values);
  expect(closed.knowledge.find(item => item.segment_id === "seg_edge17" && item.vehicle_type === "motorbike")?.state).toBe("authoritative_closed");
  const report = await submitDriver(driver, scenario, "seg_edge17"), before = await snapshot(owner);
  expect(report.status).not.toBe("accepted"); expect(report.description).toBe(descriptionFor(scenario));
  expect(report.review_result_id).toBeNull(); expectNoImageEffects(before, await snapshot(owner));
  const fieldReview = await call(`/sessions/${owner.id}/reports/${report.report_id}/reviews`, { method: "POST", headers: headers(contributor,
    { "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": (await current(owner)).etag }),
    body: JSON.stringify({ decision: "accept", reason: "Injected role claim", mapped_segment_id: null, vehicle_types: [], condition: "normal" }) });
  expect(fieldReview.status).toBe(403);
  const foreignRead = await call(`/sessions/${other.id}/reports/${report.report_id}`, { headers: headers(other) }); expect(foreignRead.status).toBe(404);
  const rejected = await manualDecision(owner, report.report_id, "reject", null); expect(rejected.status).toBe(200);
  const final = await snapshot(owner), finalRun = simulationPersistence.read(final.values);
  expect(finalRun.knowledge.find(item => item.segment_id === "seg_edge17" && item.vehicle_type === "motorbike")?.state).toBe("authoritative_closed");
  expect(final.values.simulation).toEqual(before.values.simulation);
  expect(sourceState(final.values).reports[report.report_id]?.report.status).toBe("rejected");
});

it("PI-20 benign driver text containing system remains manually reviewable", async () => {
  const scenario = runtimeScenarios.find(item => item.case_id === "PI-20")!;
  const owner = await createV2(), driver = await join(owner, "driver", "drv_moto01"), contributor = await join(owner, "contributor", "contributor_functional1"), other = await createV2();
  const report = await submitDriver(driver, scenario, "seg_edge27", "caution"), before = await snapshot(owner);
  expect(report.status).toBe("pending_review"); expect(report.description).toBe(descriptionFor(scenario));
  expectNoImageEffects(before, await snapshot(owner));
  const denied = await call(`/sessions/${owner.id}/reports/${report.report_id}`, { headers: headers(contributor) }); expect(denied.status).toBe(404);
  const foreign = await call(`/sessions/${other.id}/reports/${report.report_id}`, { headers: headers(other) }); expect(foreign.status).toBe(404);
  const reviewed = await accept(owner, report.report_id, "caution"); expect(reviewed.status).toBe(200);
  const result = parseSchema("ReportReviewResultResponse", await reviewed.json()).data!;
  expect(result.report.status).toBe("accepted"); expect(result.observations[0]?.condition).toBe("caution"); expect(result.award).toBeNull();
});
