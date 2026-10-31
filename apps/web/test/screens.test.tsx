import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ContributorWorkspace, DriverWorkspace, ImageReviewCard, PlanScreen, ReportForm, ReviewScreen, capabilityDestinations } from "../src/features";
import { executionReason } from "../src/features/planning/plan-actions";
import { contributorDashboard, driverDashboard, driverRoute, identity, imageBinding, imageReview, now, report, session } from "./fixtures";
import { plan } from "./plan-fixture";
import type { ImageReviewState, SubmitReportInput } from "@floodops/contracts";
afterEach(cleanup);
const context = (role: "driver" | "contributor" | "dispatcher") => ({ identity: identity(role), online: true, now });
const ready = <T,>(data: T) => ({ status: "ready" as const, data });

test("capability navigation and driver rendering never grant dispatcher role", () => {
  const driver = context("driver");
  expect(capabilityDestinations(driver).map(item => item.id)).toEqual(["driver", "driver-report"]);
  const noPermissions = { ...driver, identity: { ...driver.identity, participant: { ...driver.identity.participant, permissions: [] } } };
  render(<DriverWorkspace context={noPermissions} resource={ready(driverDashboard)} />);
  expect(screen.queryByRole("heading", { name: "Việc của tôi" })).toBeNull();
  expect(screen.getByText("Capability hiện tại không cấp quyền này.")).toBeDefined();
});
test("committed driver data shows waiting for null ETA and refuses another entity", () => {
  const { rerender } = render(<DriverWorkspace context={context("driver")} resource={ready(driverDashboard)} />);
  expect(screen.getByText("Đang chờ — ETA chưa có")).toBeDefined();
  expect(screen.getByText(/pickup · order_fixture001/)).toBeDefined();
  expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
  rerender(<DriverWorkspace context={context("driver")} resource={ready({ ...driverDashboard, driver_id: "other-driver" })} />);
  expect(screen.queryByText("order_fixture001 · critical")).toBeNull();
});
test("contributor accepted report with no award remains zero simulated points", () => {
  render(<ContributorWorkspace context={context("contributor")} resource={ready(contributorDashboard)} />);
  expect(screen.getByText("accepted")).toBeDefined();
  expect(screen.getByText("Tổng: 0")).toBeDefined();
  expect(screen.getByText(/Chưa có award/)).toBeDefined();
  expect(screen.getByText("Chưa có điểm được cấp.")).toBeDefined();
});
test("stale/loading/error and expired capability do not expose current-looking data", () => {
  const { rerender } = render(<DriverWorkspace context={context("driver")} resource={{ status: "loading" }} />);
  expect(screen.getByRole("status", { name: "Đang tải dữ liệu phiên" })).toBeDefined();
  rerender(<DriverWorkspace context={context("driver")} resource={{ status: "error", message: "Unavailable" }} />);
  expect(screen.getByText("Unavailable")).toBeDefined();
  rerender(<DriverWorkspace context={context("driver")} resource={{ status: "stale" }} />);
  expect(screen.queryByText("order_fixture001 · critical")).toBeNull();
  rerender(<DriverWorkspace context={{ ...context("driver"), now: Date.parse("2100-01-01T00:00:00Z") }} resource={ready(driverDashboard)} />);
  expect(screen.queryByRole("heading", { name: "Việc của tôi" })).toBeNull();
});
function fillReport() {
  fireEvent.change(screen.getByLabelText("Đoạn đường (required)"), { target: { value: "segment_E270001" } });
  fireEvent.change(screen.getByLabelText("Thời gian chụp RFC3339 (required)"), { target: { value: report.captured_at } });
  fireEvent.change(screen.getByLabelText("Mô tả"), { target: { value: "Nội dung được giữ" } });
}
test("report form focuses errors, retains content and submits validated first media choice", async () => {
  const submit = vi.fn<(input: SubmitReportInput) => Promise<void>>(async () => undefined);
  render(<ReportForm kind="citizen" context={context("contributor")} mediaChoices={[{ id: "photo_fixture001", kind: "fixture", label: "Allowed fixture" }]} onSubmit={submit} />);
  fireEvent.change(screen.getByLabelText("Mô tả"), { target: { value: "Nội dung được giữ" } });
  fireEvent.submit(screen.getByRole("form", { name: "Gửi báo cáo" }));
  expect(submit).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(screen.getByRole("alert", { name: "Check the form" }));
  expect((screen.getByLabelText("Mô tả") as HTMLTextAreaElement).value).toBe("Nội dung được giữ");
  fillReport(); fireEvent.change(screen.getByLabelText("Ảnh được phép"), { target: { value: "fixture:photo_fixture001" } });
  fireEvent.submit(screen.getByRole("form", { name: "Gửi báo cáo" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0]?.[0]).toMatchObject({ kind: "citizen", fixture_photo_id: "photo_fixture001", media_id: null, segment_id: "segment_E270001" });
});
test("offline report does not send and Reset cannot silently relink previous form content", () => {
  const submit = vi.fn<(input: SubmitReportInput) => Promise<void>>(async () => undefined); const ctx = context("driver");
  const { rerender } = render(<ReportForm kind="driver" context={{ ...ctx, online: false }} onSubmit={submit} />);
  fillReport();
  expect((screen.getByRole("button", { name: "Gửi báo cáo" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.submit(screen.getByRole("form", { name: "Gửi báo cáo" })); expect(submit).not.toHaveBeenCalled();
  rerender(<ReportForm kind="driver" context={{ ...ctx, identity: { ...ctx.identity, session: { ...session, generation: 2 } } }} onSubmit={submit} />);
  expect((screen.getByLabelText("Mô tả") as HTMLTextAreaElement).value).toBe("");
});
function reviewProps() { return { context: context("dispatcher"), session, report, imageReview: ready(imageReview), imageBinding, normalizedImageReady: true,
  onReview: vi.fn(async () => undefined), onAiRequest: vi.fn<() => Promise<void>>(async () => undefined) }; }
test("AI pending/failure does not disable manual review or fabricate a score", async () => {
  const props = reviewProps();
  const pending: ImageReviewState = { ...imageReview, job: { ...imageReview.job!, status: "running", result: null, completed_at: null } };
  const { rerender } = render(<ReviewScreen {...props} imageReview={ready(pending)} />);
  expect(screen.queryByText(/Chất lượng ảnh:/)).toBeNull();
  expect((screen.getByRole("button", { name: "Reject" }) as HTMLButtonElement).disabled).toBe(false);
  fireEvent.change(screen.getByLabelText("Lý do review"), { target: { value: "Chưa đủ xác minh" } });
  fireEvent.click(screen.getByRole("button", { name: "Reject" }));
  await waitFor(() => expect(props.onReview).toHaveBeenCalledWith(expect.objectContaining({ decision: "reject", reason: "Chưa đủ xác minh" })));
  rerender(<ReviewScreen {...props} imageReview={ready({ ...imageReview, job: { ...imageReview.job!, status: "failed", result: null, error_code: "MODEL_TIMEOUT" } })} />);
  expect(screen.queryByText(/Chất lượng ảnh:/)).toBeNull();
  expect((screen.getByRole("button", { name: "Accept" }) as HTMLButtonElement).disabled).toBe(false);
});
test("in-flight AI command remains independent of manual decision", async () => {
  const props = reviewProps(); let finish!: () => void;
  props.onAiRequest = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  render(<ReviewScreen {...props} />); fireEvent.click(screen.getByRole("button", { name: "AI nhận xét" }));
  expect((screen.getByRole("button", { name: "Accept" }) as HTMLButtonElement).disabled).toBe(false);
  fireEvent.change(screen.getByLabelText("Lý do review"), { target: { value: "Manual" } });
  fireEvent.click(screen.getByRole("button", { name: "Reject" }));
  await waitFor(() => expect(props.onReview).toHaveBeenCalledTimes(1)); finish();
});
test("report navigation resets confirmations and never displays previous report's AI", () => {
  const props = reviewProps(); const { rerender } = render(<ReviewScreen {...props} />);
  fireEvent.change(screen.getByLabelText("Lý do review"), { target: { value: "Old report confirmation" } });
  expect(screen.getByText("Chất lượng ảnh: 75/100")).toBeDefined();
  rerender(<ReviewScreen {...props} report={{ ...report, report_id: "report_fixture002", segment_id: "segment_E280001" }} />);
  expect((screen.getByLabelText("Lý do review") as HTMLTextAreaElement).value).toBe("");
  expect((screen.getByLabelText("Đoạn đường xác nhận") as HTMLInputElement).value).toBe("segment_E280001");
  expect(screen.queryByText("Chất lượng ảnh: 75/100")).toBeNull();
});
test("valid server zero is visible, null/superseded/mismatched/invalid advice is not", () => {
  const zero: ImageReviewState = { ...imageReview, job: { ...imageReview.job!, result: { ...imageReview.job!.result!,
    quality_ratings: { sharpness: 0, lighting: 0, scene_visibility: 0, detail: 0 }, quality_score: 0, recommendation: "insufficient_evidence" } } };
  const { rerender } = render(<ImageReviewCard resource={ready(zero)} binding={imageBinding} />);
  expect(screen.getByText("Chất lượng ảnh: 0/100")).toBeDefined();
  for (const data of [{ report_id: report.report_id, job: null }, { ...imageReview, job: { ...imageReview.job!, status: "superseded" as const, result: null } },
    { ...imageReview, job: { ...imageReview.job!, input_digest: "c".repeat(64) } },
    { ...imageReview, job: { ...imageReview.job!, result: { ...imageReview.job!.result!, quality_score: 0 } } }]) {
    rerender(<ImageReviewCard resource={ready(data)} binding={imageBinding} />);
    expect(screen.queryByText(/Chất lượng ảnh:/)).toBeNull();
  }
});
test("Approve invokes decision only; Execute needs explicit separate action", async () => {
  const decide = vi.fn(async () => undefined), execute = vi.fn(async () => undefined);
  render(<PlanScreen context={context("dispatcher")} resource={ready(plan)} onDecision={decide} onExecute={execute} onDryRun={vi.fn()} />);
  fireEvent.click(screen.getByRole("checkbox", { name: /action_fixture001 · reroute/ }));
  fireEvent.change(screen.getByLabelText("Lý do quyết định"), { target: { value: "Reviewed" } });
  fireEvent.click(screen.getByRole("button", { name: "Approve" }));
  await waitFor(() => expect(decide).toHaveBeenCalledWith({ action_ids: ["action_fixture001"], decision: "approve", reason: "Reviewed" }));
  expect(execute).not.toHaveBeenCalled(); expect(plan.status).toBe("ready");
  expect(screen.getByText("Đang chờ — ETA chưa có")).toBeDefined();
});
test("independent ready group is executable alongside pending group; dependency/stale remains blocked", () => {
  const mixed = { ...plan, status: "pending_approval" as const, groups: [...plan.groups, { group_id: "pending-group", action_ids: ["pending-action"], depends_on_group_ids: [] }] };
  expect(executionReason(mixed, ["group_fixture001"])).toBeNull();
  expect(executionReason(mixed, ["pending-group"])).toContain("chưa ready");
  expect(executionReason({ ...mixed, groups: [{ ...plan.groups[0]!, depends_on_group_ids: ["pending-group"] }, mixed.groups[1]!] }, ["group_fixture001"])).toContain("dependency");
  render(<PlanScreen context={context("dispatcher")} resource={ready({ ...plan, input_revision: 3 })} onDecision={vi.fn()} onExecute={vi.fn()} onDryRun={vi.fn()} />);
  expect((screen.getByRole("button", { name: "Execute" }) as HTMLButtonElement).disabled).toBe(true);
});

test("driver route detail is restricted to current dashboard pointers", () => {
  const { rerender } = render(<DriverWorkspace context={context("driver")} resource={ready(driverDashboard)} routes={ready([driverRoute])} />);
  expect(screen.getByText("Các đoạn đường: segment_E270001")).toBeDefined();
  expect(screen.getByText(/Snapshot tuyến · candidate/)).toBeDefined();
  rerender(<DriverWorkspace context={context("driver")} resource={ready(driverDashboard)} routes={ready([{ ...driverRoute, driver_id: "driver_other001" }])} />);
  expect(screen.queryByText("Các đoạn đường: segment_E270001")).toBeNull();
});

test("media selection follows stable ID across reordering and rejects removed photo", async () => {
  const submit = vi.fn<(input: SubmitReportInput) => Promise<void>>(async () => undefined);
  const first = { id: "photo_alpha001", kind: "fixture" as const, label: "Photo A" }, second = { id: "photo_beta001", kind: "fixture" as const, label: "Photo B" };
  const props = { kind: "citizen" as const, context: context("contributor"), onSubmit: submit };
  const { rerender } = render(<ReportForm {...props} mediaChoices={[first, second]} />);
  fillReport(); fireEvent.change(screen.getByLabelText("Ảnh được phép"), { target: { value: "fixture:photo_alpha001" } });
  rerender(<ReportForm {...props} mediaChoices={[second, first]} />);
  fireEvent.submit(screen.getByRole("form", { name: "Gửi báo cáo" }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ fixture_photo_id: "photo_alpha001" })));
  rerender(<ReportForm {...props} mediaChoices={[second]} />);
  fireEvent.submit(screen.getByRole("form", { name: "Gửi báo cáo" })); expect(submit).toHaveBeenCalledTimes(1);
});

test("AI and Accept require pending normalized photo; Reject ignores invalid mapping", async () => {
  const props = reviewProps(); const { rerender } = render(<ReviewScreen {...props} report={{ ...report, status: "needs_clarification" }} />);
  expect((screen.getByRole("button", { name: "AI nhận xét" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Accept" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Đoạn đường xác nhận"), { target: { value: "invalid id!" } });
  fireEvent.change(screen.getByLabelText("Lý do review"), { target: { value: "Unmapped evidence" } });
  fireEvent.click(screen.getByRole("button", { name: "Reject" }));
  await waitFor(() => expect(props.onReview).toHaveBeenCalledWith({ decision: "reject", reason: "Unmapped evidence", mapped_segment_id: null, vehicle_types: [], condition: null }));
  rerender(<ReviewScreen {...props} normalizedImageReady={false} />);
  expect((screen.getByRole("button", { name: "AI nhận xét" }) as HTMLButtonElement).disabled).toBe(true);
});
test("observable report changes hide advice immediately at unchanged input revision", () => {
  const props = reviewProps(); const { rerender } = render(<ReviewScreen {...props} />);
  expect(screen.getByText("Chất lượng ảnh: 75/100")).toBeDefined();
  rerender(<ReviewScreen {...props} report={{ ...report, description: "Changed image context" }} />);
  expect(screen.queryByText("Chất lượng ảnh: 75/100")).toBeNull();
});
