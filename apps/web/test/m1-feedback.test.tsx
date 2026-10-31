import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AwardSchema, PlanningJobSchema, ReportSchema, type ReportReward } from "@floodops/contracts";
import { RewardFeedback } from "../src/features/reports/reward-feedback";
import { ContributorWorkspace } from "../src/features/reports/contributor-workspace";
import { ReviewScreen } from "../src/features/reports/review-screen";
import { PlanningJobPanel } from "../src/features/planning/planning-job-panel";
import { contributorDashboard, identity, now, report, session } from "./fixtures";
afterEach(cleanup);
const policy = { policy_id: "policy_test001", version: "synthetic-v1", config_hash: "c".repeat(64) };
const reviewed = { status: "accepted", review_result_id: "review_test001", reviewed_at: "2026-10-31T00:13:00Z" };
const rewards: ReportReward[] = [
  { status: "pending_review", policy, reason_code: "AWAITING_REVIEW", award_id: null },
  { status: "pending_config", policy: null, reason_code: "POLICY_NOT_CONFIGURED", award_id: null },
  { status: "ineligible", policy, reason_code: "NOT_ELIGIBLE", award_id: null },
  { status: "committed", policy, reason_code: "AWARDED", award_id: "award_test001" },
];
test.each(rewards)("reward $status renders canonical feedback independently from review/points", reward => {
  const value = ReportSchema.parse({ ...report, ...(reward.status !== "pending_review" ? reviewed : {}), reward, award_id: reward.award_id });
  render(<RewardFeedback report={value} />);
  expect(screen.getByText(reward.reason_code)).toBeDefined();
  if (reward.status === "committed") expect(screen.getByText("Award ledger: award_test001")).toBeDefined();
  else expect(screen.getByText("Chưa có award. Accepted không tự cộng điểm.")).toBeDefined();
  if (!reward.policy) expect(screen.getByText(/không tự gán policy mới hoặc cộng điểm sau/)).toBeDefined();
  expect(screen.queryByText(/^0 điểm$/)).toBeNull();
});
test("missing reward policy does not block valid manual review or place policy in the decision", async () => {
  const onReview = vi.fn(async () => undefined);
  render(<ReviewScreen context={{ identity: identity("dispatcher"), online: true, now }} session={session} report={report}
    imageReview={{ status: "loading" }} imageBinding={null} normalizedImageReady onReview={onReview} onAiRequest={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Vehicle xác nhận"), { target: { value: "motorbike" } });
  fireEvent.change(screen.getByLabelText("Tình trạng xác nhận"), { target: { value: "normal" } });
  fireEvent.change(screen.getByLabelText("Lý do review"), { target: { value: "Manual synthetic review" } });
  fireEvent.click(screen.getByRole("button", { name: "Accept" }));
  await waitFor(() => expect(onReview).toHaveBeenCalledWith({ decision: "accept", reason: "Manual synthetic review", mapped_segment_id: report.segment_id, vehicle_types: ["motorbike"], condition: "normal" }));
  expect(report.reward.policy).toBeNull();
});
test("contributor shows only committed authoritative ledger and its policy/review binding", () => {
  const award = AwardSchema.parse({ award_id: "award_test001", report_id: report.report_id, contributor_id: "contributor_entity001", filled_gap_ids: ["gap_test001"],
    points: 3, event_sequence: 8, awarded_at: reviewed.reviewed_at, is_simulated: true, reward_policy: policy, review_result_id: reviewed.review_result_id });
  render(<ContributorWorkspace context={{ identity: identity("contributor"), online: true, now }} resource={{ status: "ready", data: { ...contributorDashboard, awards: [award], points_total: 3 } }} />);
  expect(screen.getByText("Tổng: 3")).toBeDefined();
  expect(screen.getByText(/policy_test001/)).toBeDefined();
  expect(screen.getByText("review_test001")).toBeDefined();
});
test.each(["NO_FEASIBLE_PLAN", "PLANNER_TIMEOUT"] as const)("deterministic %s is a typed failed job without automatic execution", async error => {
  const job = PlanningJobSchema.parse({ job_id: "job_test001", session_id: session.session_id, generation: 1, input_revision: 4, status: "failed", plan_id: null,
    error_code: error, created_at: session.created_at, completed_at: "2026-10-31T00:00:01Z", planner: { kind: "deterministic", algorithm_version: "synthetic-v1", config_hash: "d".repeat(64), search_limit: 7 } });
  const onStart = vi.fn(async () => undefined), base = identity("dispatcher");
  render(<PlanningJobPanel context={{ identity: { ...base, participant: { ...base.participant, permissions: [...base.participant.permissions, "planning:request"] } }, online: true, now }} job={job} refreshing={false} onStart={onStart} onRefresh={vi.fn()} />);
  expect(screen.getByText(error).closest('[role="alert"]')).not.toBeNull();
  expect(screen.getByText("7")).toBeDefined(); expect(screen.getByText("Job chưa có plan khả dụng.")).toBeDefined();
  expect(screen.queryByRole("button", { name: "Execute" })).toBeNull(); expect(onStart).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Yêu cầu lập kế hoạch" })); await waitFor(() => expect(onStart).toHaveBeenCalledTimes(1));
});
