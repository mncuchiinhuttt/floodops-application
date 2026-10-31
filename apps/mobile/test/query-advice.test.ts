import { reportInputKey } from "../src/features/reports/report-input-key";
import { initialQuery, reduceQuery } from "../src/shared/query-state";
import { adviceEvent, beginAdvice, initialAdvice, receiveAdvice } from "../src/features/reports/image-review-state";
import { fixtureEvent, fixtureJob, fixtureReport, fixtureSession } from "../preview/fixture-data";
test("query fences overlapping reads, older sequence and Reset generation", () => {
  let view = initialQuery<string>(fixtureSession);
  view = reduceQuery(view, { type: "begin" });
  view = reduceQuery(view, { type: "begin" });
  expect(reduceQuery(view, { type: "loaded", request: 1, session: fixtureSession, data: "late" })).toBe(view);
  view = reduceQuery(view, { type: "loaded", request: 2, session: { ...fixtureSession, event_sequence: 7 }, data: "current" });
  expect(view.data).toBe("current");
  expect(reduceQuery(view, { type: "loaded", request: 2, session: fixtureSession, data: "older" })).toBe(view);
  const reset = reduceQuery(view, { type: "reset", session: { ...fixtureSession, generation: 2 } });
  expect(reset.data).toBeNull();
  expect(reduceQuery(reset, { type: "loaded", request: 2, session: fixtureSession, data: "old generation" })).toBe(reset);
});
test("offline invalidates in-flight reads; rejoin clears cached authority", () => {
  let view = reduceQuery(initialQuery<string>(fixtureSession), { type: "loaded", request: 0, session: fixtureSession, data: "cached" });
  view = reduceQuery(view, { type: "offline" });
  expect(view.data).toBe("cached");
  expect(reduceQuery(view, { type: "loaded", request: 0, session: fixtureSession, data: "late" })).toBe(view);
  view = reduceQuery(view, { type: "failed", request: view.request, rejoin: true, message: "Revoked" });
  expect(view.status).toBe("relink"); expect(view.data).toBeNull();
});
test("AI same-revision event invalidates score and obsolete fetch tickets immediately", () => {
  const job = fixtureJob();
  const binding = { session_id: job.session_id, generation: job.generation, reportId: job.report_id, jobId: null, inputDigest: null, reportInput: reportInputKey(fixtureReport()) };
  let view = initialAdvice(binding, 5);
  view = receiveAdvice(view, binding, { report_id: job.report_id, job }, fixtureSession, 0);
  expect(view.binding.jobId).toBe(job.job_id); expect(view.job?.result?.quality_score).toBe(75);
  const change = adviceEvent(view, fixtureEvent());
  expect(change.refetch).toBe(true); expect(change.view.job).toBeNull();
  expect(receiveAdvice(change.view, view.binding, { report_id: job.report_id, job }, { ...fixtureSession, event_sequence: 6 }, 0)).toBe(change.view);
  const loading = beginAdvice(change.view);
  const next = receiveAdvice(loading, loading.binding, { report_id: job.report_id, job }, { ...fixtureSession, event_sequence: 6 }, loading.request);
  expect(next.job).toBe(job);
});
test("AI refuses wrong digest/job/report/generation and cannot revive after manual decision or Reset", () => {
  const job = fixtureJob();
  const binding = { session_id: job.session_id, generation: 1, reportId: job.report_id, jobId: job.job_id, inputDigest: job.input_digest, reportInput: reportInputKey(fixtureReport()) };
  const view = initialAdvice(binding, 5);
  for (const patch of [{ input_digest: "b".repeat(64) }, { job_id: "irj_other001" }, { report_id: "rep_other001" }, { generation: 2 }]) {
    expect(receiveAdvice(view, binding, { report_id: job.report_id, job: { ...job, ...patch } }, fixtureSession, 0)).toBe(view);
  }
  const populated = receiveAdvice(view, binding, { report_id: job.report_id, job }, fixtureSession, 0);
  expect(adviceEvent(populated, fixtureEvent("report_changed")).view.job).toBeNull();
  expect(adviceEvent(populated, fixtureEvent("image_review_changed", 4)).refetch).toBe(false);
  const reset = adviceEvent(populated, fixtureEvent("session_reset")).view;
  expect(reset.invalidated).toBe(true); expect(beginAdvice(reset)).toBe(reset);
  expect(receiveAdvice(reset, binding, { report_id: job.report_id, job }, { ...fixtureSession, event_sequence: 7 }, reset.request)).toBe(reset);
});

test("unrelated event progress during a deferred advice GET does not discard an exact-input result", () => {
  const job = fixtureJob();
  const binding = { session_id: job.session_id, generation: job.generation, reportId: job.report_id, jobId: job.job_id, inputDigest: job.input_digest, reportInput: reportInputKey(fixtureReport()) };
  let view = initialAdvice(binding, 5); view = beginAdvice(view);
  view = adviceEvent(view, { ...fixtureEvent("state_changed", 6), resource_ids: [] }).view;
  const result = receiveAdvice(view, binding, { report_id: job.report_id, job }, fixtureSession, view.request);
  expect(result.job).toBe(job); expect(result.sequence).toBe(6); expect(result.loading).toBe(false);
});
