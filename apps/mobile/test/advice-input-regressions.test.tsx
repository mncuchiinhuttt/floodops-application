import { render, screen } from "@testing-library/react-native";
import type { Report } from "@floodops/contracts";
import { ReviewScreen } from "../src/features/reports/review-screen";
import { beginAdvice, initialAdvice, receiveAdvice } from "../src/features/reports/image-review-state";
import { reportInputKey } from "../src/features/reports/report-input-key";
import { fixtureContext, fixtureJob, fixtureReport } from "../preview/fixture-data";

function readyAdvice(report: Report, request = 0) {
  const context = fixtureContext(); const job = fixtureJob();
  const binding = { session_id: job.session_id, generation: job.generation, reportId: report.report_id,
    jobId: job.job_id, inputDigest: job.input_digest, reportInput: reportInputKey(report) };
  let view = initialAdvice(binding, context.session.event_sequence);
  for (let index = 0; index < request; index++) view = beginAdvice(view, binding);
  return receiveAdvice(view, binding, { report_id: report.report_id, job }, context.session, view.request);
}
const changedInputs: [string, Partial<Report>][] = [
  ["description", { description: "Changed road description" }],
  ["segment", { segment_id: "seg_changed01" }],
  ["coordinate", { coordinate: [106.7, 10.7] }],
  ["capture timestamp", { captured_at: "2026-10-31T00:09:00Z" }],
  ["capture simulation minute", { captured_sim_minute: 9 }],
  ["vehicle scope", { vehicle_types: ["car"] }],
  ["normalized media", { media_id: "med_changed01" }],
  ["permitted fixture", { media_id: null, fixture_photo_id: "pho_changed01" }],
  ["report status", { status: "accepted" }],
];

test.each(changedInputs)("changed %s hides the old score on the first new render before refetch", async (_name, patch) => {
  const context = { ...fixtureContext(), online: true }; const original = fixtureReport(); const advice = readyAdvice(original);
  await render(<ReviewScreen context={context} report={original} advice={advice} />);
  expect(screen.getByText("Chất lượng ảnh: 75/100")).toBeOnTheScreen();
  await screen.rerender(<ReviewScreen context={context} report={{ ...original, ...patch }} advice={advice} />);
  // No waitFor: field changes must synchronously remove the score before any async invalidation effect.
  expect(screen.queryByText(/Chất lượng ảnh:/)).toBeNull();
});

test("unrelated operational revision/event progress preserves advice for the exact same report input", async () => {
  const context = { ...fixtureContext(), online: true }; const report = fixtureReport(); const advice = readyAdvice(report);
  await render(<ReviewScreen context={context} report={report} advice={advice} />);
  const unrelated = { ...context, session: { ...context.session, revision: context.session.revision + 1, event_sequence: context.session.event_sequence + 1 } };
  await screen.rerender(<ReviewScreen context={unrelated} report={report} advice={advice} />);
  expect(screen.getByText("Chất lượng ảnh: 75/100")).toBeOnTheScreen();
});

test("A to B to A cannot revive the old score until a new scoped fetch ticket completes", async () => {
  const context = { ...fixtureContext(), online: true }; const a = fixtureReport(); const b = { ...a, description: "Second input context" };
  const oldAdvice = readyAdvice(a);
  await render(<ReviewScreen context={context} report={a} advice={oldAdvice} />);
  expect(screen.getByText("Chất lượng ảnh: 75/100")).toBeOnTheScreen();
  await screen.rerender(<ReviewScreen context={context} report={b} advice={oldAdvice} />);
  expect(screen.queryByText(/Chất lượng ảnh:/)).toBeNull();
  await screen.rerender(<ReviewScreen context={context} report={a} advice={oldAdvice} />);
  expect(screen.queryByText(/Chất lượng ảnh:/)).toBeNull();
  const refreshed = readyAdvice(a, oldAdvice.request + 1);
  await screen.rerender(<ReviewScreen context={context} report={a} advice={refreshed} />);
  expect(screen.getByText("Chất lượng ảnh: 75/100")).toBeOnTheScreen();
});

test("request reducer rejects a response bound to different visible input even when job/digest match", () => {
  const a = fixtureReport(); const b = { ...a, description: "Different visible input" };
  const current = readyAdvice(a); const loading = beginAdvice(current);
  const foreignBinding = { ...loading.binding, reportInput: reportInputKey(b) };
  const result = receiveAdvice(loading, foreignBinding, { report_id: a.report_id, job: fixtureJob() }, fixtureContext().session, loading.request);
  expect(result).toBe(loading); expect(result.job).toBeNull();
});

test("vehicle order does not create a different observable input key", () => {
  const report = fixtureReport();
  expect(reportInputKey({ ...report, vehicle_types: ["motorbike", "car"] })).toBe(reportInputKey({ ...report, vehicle_types: ["car", "motorbike"] }));
});
