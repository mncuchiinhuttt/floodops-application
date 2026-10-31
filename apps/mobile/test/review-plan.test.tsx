import { reportInputKey } from "../src/features/reports/report-input-key";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ReviewScreen } from "../src/features/reports/review-screen";
import { initialAdvice, receiveAdvice } from "../src/features/reports/image-review-state";
import { PlanScreen } from "../src/features/planning/plan-screen";
import { fixtureContext, fixtureJob, fixturePlan, fixtureReport } from "../preview/fixture-data";
function advice(status: Parameters<typeof fixtureJob>[0] = "completed") {
  const job = fixtureJob(status); const context = fixtureContext();
  const binding = { session_id: job.session_id, generation: 1, reportId: job.report_id, jobId: job.job_id, inputDigest: job.input_digest, reportInput: reportInputKey(fixtureReport()) };
  return receiveAdvice(initialAdvice(binding, 5), binding, { report_id: job.report_id, job }, context.session, 0);
}
test.each(["running", "failed"] as const)("AI %s has no score while manual review remains independent", async status => {
  const context = { ...fixtureContext(), online: true }; const review = jest.fn(); const ai = jest.fn();
  await render(<ReviewScreen context={context} report={fixtureReport()} advice={advice(status)} onReview={review} onAiRequest={ai} />);
  expect(screen.queryByText(/Chất lượng ảnh:/)).toBeNull();
  await fireEvent.changeText(screen.getByLabelText("Manual decision reason"), "Checked capture and mapping");
  await fireEvent.press(screen.getByRole("button", { name: "Confirm caution" }));
  expect(screen.getByRole("button", { name: "Accept report" })).toBeEnabled();
  await fireEvent.press(screen.getByRole("button", { name: "Accept report" }));
  expect(review).toHaveBeenCalledWith({ decision: "accept", reason: "Checked capture and mapping", mapped_segment_id: "seg_fixture01", vehicle_types: ["motorbike"], condition: "caution" });
  expect(ai).not.toHaveBeenCalled();
});
test("current completed advice shows rubric semantics and never preselects a manual verdict", async () => {
  const review = jest.fn();
  await render(<ReviewScreen context={{ ...fixtureContext(), online: true }} report={fixtureReport()} advice={advice()} onReview={review} />);
  expect(screen.getByText("Chất lượng ảnh: 75/100")).toBeOnTheScreen();
  expect(screen.getByText("sharpness: 1/2")).toBeOnTheScreen();
  expect(screen.getByText("Reason: Synthetic test reason")).toBeOnTheScreen();
  expect(screen.getByText(/It does not verify authenticity/)).toBeOnTheScreen(); expect(review).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Accept report" })).toBeDisabled();
});
test("manual decision, invalidation or different report removes old AI score; role denial hides private data", async () => {
  const context = { ...fixtureContext(), online: true }; const report = fixtureReport(); const currentAdvice = advice();
  await render(<ReviewScreen context={context} report={report} advice={currentAdvice} />);
  await screen.rerender(<ReviewScreen context={context} report={{ ...report, status: "accepted" }} advice={currentAdvice} />);
  expect(screen.queryByText(/Chất lượng ảnh:/)).toBeNull();
  await screen.rerender(<ReviewScreen context={context} report={report} advice={{ ...currentAdvice, loading: true, job: null }} />);
  expect(screen.queryByText(/Chất lượng ảnh:/)).toBeNull();
  await screen.rerender(<ReviewScreen context={fixtureContext("driver")} report={report} advice={currentAdvice} />);
  expect(screen.queryByText(report.description)).toBeNull(); expect(screen.queryByRole("button", { name: "Accept report" })).toBeNull();
});
test("Approve does not Execute or change committed work; offline and superseded same-revision plans are blocked", async () => {
  const context = { ...fixtureContext(), online: true }; const plan = fixturePlan(); const decide = jest.fn(); const execute = jest.fn();
  const currentPlan = { planId: plan.plan_id, planningJobId: plan.planning_job_id };
  await render(<PlanScreen context={context} plan={plan} currentPlan={currentPlan} onDecide={decide} onExecute={execute} />);
  await fireEvent.changeText(screen.getByLabelText("Plan decision reason"), "Reviewed evidence");
  await fireEvent.press(screen.getByRole("button", { name: "Approve actions" }));
  expect(decide).toHaveBeenCalledWith({ action_ids: ["act_fixture01"], decision: "approve", reason: "Reviewed evidence" });
  expect(execute).not.toHaveBeenCalled(); expect(plan.diff[0]?.after_eta_minute).toBe(25);
  await fireEvent.press(screen.getByRole("button", { name: "Select group grp_fixture01" }));
  await fireEvent.press(screen.getByRole("button", { name: "Execute plan" }));
  expect(execute).toHaveBeenCalledWith({ group_ids: ["grp_fixture01"] });
  await screen.rerender(<PlanScreen context={context} plan={plan} currentPlan={{ ...currentPlan, planId: "pln_replaced1" }} onExecute={execute} />);
  expect(screen.getByRole("button", { name: "Execute plan" })).toBeDisabled();
  await screen.rerender(<PlanScreen context={{ ...context, online: false }} plan={plan} currentPlan={currentPlan} onExecute={execute} />);
  expect(screen.getByRole("button", { name: "Execute plan" })).toBeDisabled();
});
test("pending dependency groups and stale revision cannot Execute", async () => {
  const context = { ...fixtureContext(), online: true }; const plan = fixturePlan(); const execute = jest.fn();
  plan.actions[0]!.status = "blocked";
  await render(<PlanScreen context={context} plan={plan} currentPlan={{ planId: plan.plan_id, planningJobId: plan.planning_job_id }} onExecute={execute} />);
  expect(screen.getByRole("button", { name: "Execute plan" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Execute plan" })); expect(execute).not.toHaveBeenCalled();
});

test("pending manual review freezes the confirmed mapping/vehicle/condition controls", async () => {
  await render(<ReviewScreen context={{ ...fixtureContext(), online: true }} report={fixtureReport()} advice={advice()} pending onReview={jest.fn()} />);
  expect(screen.getByRole("button", { name: "Confirm impassable" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Review car" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Review car" }));
  expect(screen.getByText("Confirmed vehicle scope: motorbike")).toBeOnTheScreen();
});
