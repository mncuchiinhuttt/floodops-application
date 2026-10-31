// All records below are synthetic contract fixtures; no device/model/backend proof.
import { fireEvent, render, screen } from "@testing-library/react-native";
import { PlanningJobSchema, ReportSchema, type Report, type ReportReward } from "@floodops/contracts";
import { ReportRewardFeedback } from "../src/features/reports/report-reward-feedback";
import { OwnReportList } from "../src/features/reports/own-report-list";
import { ManualReviewForm } from "../src/features/reports/manual-review-form";
import { ReviewScreen } from "../src/features/reports/review-screen";
import { PlanScreen } from "../src/features/planning/plan-screen";
import { initialAdvice, receiveAdvice } from "../src/features/reports/image-review-state";
import { reportInputKey } from "../src/features/reports/report-input-key";
import { fixtureContext, fixtureJob, fixturePlan, fixtureReport } from "../preview/fixture-data";

const policy = { policy_id: "pol_fixture01", version: "fixture-m1-v1", config_hash: "c".repeat(64) };
const reviewedAt = "2026-10-31T00:12:00Z";
function rewardReport(status: ReportReward["status"]): Report {
  const report = fixtureReport();
  const reviewed = status !== "pending_review";
  const reward: ReportReward = status === "pending_config" ? { status, policy: null, reason_code: "POLICY_NOT_CONFIGURED", award_id: null }
    : status === "pending_review" ? { status, policy, reason_code: "AWAITING_REVIEW", award_id: null }
    : status === "ineligible" ? { status, policy, reason_code: "NOT_ELIGIBLE", award_id: null }
    : { status, policy, reason_code: "AWARDED", award_id: "awd_fixture01" };
  return ReportSchema.parse({ ...report, status: status === "pending_review" ? "pending_review" : status === "ineligible" ? "rejected" : "accepted",
    reward, award_id: reward.award_id, review_result_id: reviewed ? "rev_fixture01" : null, reviewed_at: reviewed ? reviewedAt : null });
}

test.each(["pending_review", "pending_config", "ineligible", "committed"] as const)("reward feedback renders exact %s fields without invented zero points", async status => {
  const report = rewardReport(status);
  await render(<ReportRewardFeedback report={report} />);
  expect(screen.getByText(new RegExp(status))).toBeOnTheScreen();
  expect(screen.getByText(new RegExp(report.reward.reason_code))).toBeOnTheScreen();
  if (report.reward.policy) {
    expect(screen.getByText(new RegExp(policy.policy_id))).toBeOnTheScreen();
    expect(screen.getByText(new RegExp(policy.version))).toBeOnTheScreen();
    expect(screen.getByText(new RegExp(policy.config_hash))).toBeOnTheScreen();
  } else expect(screen.queryByText(new RegExp(policy.policy_id))).toBeNull();
  if (report.review_result_id) expect(screen.getByText(new RegExp(report.review_result_id))).toBeOnTheScreen();
  else expect(screen.queryByText(/rev_fixture01/)).toBeNull();
  if (report.reward.award_id) expect(screen.getByText(new RegExp(report.reward.award_id))).toBeOnTheScreen();
  else expect(screen.queryByText(/awd_fixture01/)).toBeNull();
  expect(screen.queryByText(/\b0\s+(?:points|điểm)\b|(?:points|điểm)\s*[:=]\s*0/i)).toBeNull();
});

test("own accepted report remains accepted while reward is immutably pending_config with no award", async () => {
  const report = rewardReport("pending_config");
  await render(<OwnReportList reports={[report]} participantId={report.participant_id} />);
  expect(screen.getByText("accepted")).toBeOnTheScreen();
  expect(screen.getByText(/pending_config/)).toBeOnTheScreen();
  expect(screen.getByText(/POLICY_NOT_CONFIGURED/)).toBeOnTheScreen();
  expect(screen.getByText(/rev_fixture01/)).toBeOnTheScreen();
  expect(screen.queryByText(/awd_fixture01|\b0\s+points\b/i)).toBeNull();
});

test("needs_clarification permits manual Reject but never Accept, even after confirming a condition", async () => {
  const report = ReportSchema.parse({ ...fixtureReport(), status: "needs_clarification", reward: { status: "pending_config", policy: null,
    reason_code: "POLICY_NOT_CONFIGURED", award_id: null }, award_id: null, review_result_id: null, reviewed_at: null });
  const onReview = jest.fn();
  await render(<ManualReviewForm context={{ ...fixtureContext(), online: true }} report={report} pending={false} onReview={onReview} />);
  await fireEvent.changeText(screen.getByLabelText("Manual decision reason"), "Clarification remains unresolved");
  await fireEvent.press(screen.getByRole("button", { name: "Confirm normal" }));
  expect(screen.getByRole("button", { name: "Accept report" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Reject report" })).toBeEnabled();
  await fireEvent.press(screen.getByRole("button", { name: "Accept report" }));
  expect(onReview).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole("button", { name: "Reject report" }));
  expect(onReview).toHaveBeenCalledWith({ decision: "reject", reason: "Clarification remains unresolved", mapped_segment_id: report.segment_id,
    vehicle_types: report.vehicle_types, condition: "normal" });
});

test("AI failure and null reward policy do not prevent explicit manual acceptance of a pending report", async () => {
  const context = { ...fixtureContext(), online: true };
  const report = ReportSchema.parse({ ...fixtureReport(), status: "pending_review", reward: { status: "pending_config", policy: null,
    reason_code: "POLICY_NOT_CONFIGURED", award_id: null }, award_id: null, review_result_id: null, reviewed_at: null });
  const job = fixtureJob("failed");
  const binding = { session_id: job.session_id, generation: job.generation, reportId: report.report_id,
    jobId: job.job_id, inputDigest: job.input_digest, reportInput: reportInputKey(report) };
  const advice = receiveAdvice(initialAdvice(binding, context.session.event_sequence), binding, { report_id: report.report_id, job }, context.session, 0);
  const onReview = jest.fn(); const onAiRequest = jest.fn();
  await render(<ReviewScreen context={context} report={report} advice={advice} onReview={onReview} onAiRequest={onAiRequest} />);
  expect(screen.getByText(/AI review failed: MODEL_TIMEOUT/)).toBeOnTheScreen();
  expect(screen.queryByText(/Chất lượng ảnh:/)).toBeNull();
  await fireEvent.changeText(screen.getByLabelText("Manual decision reason"), "I verified the visible road condition");
  expect(screen.getByRole("button", { name: "Accept report" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Confirm unknown" }));
  expect(screen.getByRole("button", { name: "Accept report" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Confirm normal" }));
  expect(screen.getByRole("button", { name: "Accept report" })).toBeEnabled();
  await fireEvent.press(screen.getByRole("button", { name: "Accept report" }));
  expect(onReview).toHaveBeenCalledWith({ decision: "accept", reason: "I verified the visible road condition", mapped_segment_id: report.segment_id,
    vehicle_types: report.vehicle_types, condition: "normal" });
  expect(onAiRequest).not.toHaveBeenCalled();
});

test.each(["NO_FEASIBLE_PLAN", "PLANNER_TIMEOUT"] as const)("deterministic %s has no fabricated plan and requires online capability to replan", async errorCode => {
  const base = fixtureContext();
  const context = { ...base, online: true, participant: { ...base.participant, permissions: [...base.participant.permissions, "planning:request" as const] } };
  const job = PlanningJobSchema.parse({ job_id: "job_fixture01", session_id: context.session.session_id, generation: context.session.generation,
    input_revision: context.session.revision, status: "failed", plan_id: null, error_code: errorCode, created_at: "2026-10-31T00:10:00Z", completed_at: reviewedAt,
    planner: { kind: "deterministic", algorithm_version: "fixture-bounded-v1", config_hash: "d".repeat(64), search_limit: 17 } });
  const onReplan = jest.fn(); const onExecute = jest.fn();
  await render(<PlanScreen context={context} plan={null} currentPlan={null} job={job} onReplan={onReplan} onExecute={onExecute} />);
  expect(screen.getByText(new RegExp(errorCode))).toBeOnTheScreen();
  expect(screen.getByText(/fixture-bounded-v1/)).toBeOnTheScreen();
  expect(screen.getByText(new RegExp(job.planner.config_hash))).toBeOnTheScreen();
  expect(screen.getByText(/\b17\b/)).toBeOnTheScreen();
  expect(screen.queryByText(/Projected ·/)).toBeNull();
  expect(screen.queryByRole("button", { name: "Execute plan" })).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Request new plan" }));
  expect(onReplan).toHaveBeenCalledTimes(1); expect(onExecute).not.toHaveBeenCalled();
  await screen.rerender(<PlanScreen context={{ ...context, online: false }} plan={null} currentPlan={null} job={job} onReplan={onReplan} />);
  expect(screen.getByRole("button", { name: "Request new plan" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Request new plan" }));
  await screen.rerender(<PlanScreen context={{ ...context, freshness: "stale" }} plan={null} currentPlan={null} job={job} onReplan={onReplan} />);
  expect(screen.getByRole("button", { name: "Request new plan" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Request new plan" }));
  expect(onReplan).toHaveBeenCalledTimes(1);
});


test("a newer same-revision planning job prevents execution of an older proposal", async () => {
  const context = { ...fixtureContext(), online: true }, plan = fixturePlan(), onExecute = jest.fn();
  const job = PlanningJobSchema.parse({ job_id: "job_newer0001", session_id: context.session.session_id, generation: context.session.generation,
    input_revision: context.session.revision, status: "queued", plan_id: null, error_code: null, created_at: "2026-10-31T00:10:00Z", completed_at: null,
    planner: { kind: "deterministic", algorithm_version: "fixture-bounded-v1", config_hash: "d".repeat(64), search_limit: 17 } });
  await render(<PlanScreen context={context} plan={plan} currentPlan={{ planId: plan.plan_id, planningJobId: plan.planning_job_id }} job={job} onExecute={onExecute} onReplan={jest.fn()} />);
  await fireEvent.press(screen.getByRole("button", { name: "Select group grp_fixture01" }));
  expect(screen.getByRole("button", { name: "Execute plan" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Request new plan" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Execute plan" }));
  expect(onExecute).not.toHaveBeenCalled();
});
