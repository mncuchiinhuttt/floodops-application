import { fireEvent, render, screen } from "@testing-library/react-native";
import { WorkspaceScreen } from "../src/features/session/workspace-screen";
import { DriverScreen } from "../src/features/driver/driver-screen";
import { ContributorScreen } from "../src/features/rewards/contributor-screen";
import { NativeFixturePreview } from "../preview/native-fixture-preview";
import { initialQuery } from "../src/shared/query-state";
import { fixtureContext, fixtureContributor, fixtureDriver, fixtureReport } from "../preview/fixture-data";
test.each(["driver", "contributor"] as const)("%s navigation comes from server capability and excludes dispatcher actions", async role => {
  const onNavigate = jest.fn();
  await render(<WorkspaceScreen context={fixtureContext(role)} onNavigate={onNavigate} />);
  expect(screen.queryByRole("button", { name: "Plan and execution" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Report review" })).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Send a report" }));
  expect(onNavigate).toHaveBeenCalledWith("report");
});
test("driver renders only bound committed orders, null ETA and stops; mismatched dashboard stays hidden", async () => {
  const context = fixtureContext("driver"); const dashboard = fixtureDriver();
  const query = { ...initialQuery<typeof dashboard>(context.session), status: "ready" as const, data: dashboard };
  await render(<DriverScreen context={context} query={query} />);
  expect(screen.getByText("Committed ETA: Waiting / unavailable")).toBeOnTheScreen();
  expect(screen.getByText(/1\. pickup ord_fixture01/)).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: /Accept/ })).toBeNull();
  await screen.rerender(<DriverScreen context={context} query={{ ...query, data: { ...dashboard, driver_id: "drv_someone1" } }} />);
  expect(screen.queryByText("Committed ETA: Waiting / unavailable")).toBeNull();
  expect(screen.getByText("Refresh your own driver dashboard.")).toBeOnTheScreen();
});
test("contributor filters reports and awards by own authorized identity, never invents points", async () => {
  const context = fixtureContext("contributor"); const dashboard = fixtureContributor();
  dashboard.own_reports.push({ ...fixtureReport(), report_id: "rep_private01", participant_id: "par_someone1", description: "Someone else's report" });
  await render(<ContributorScreen context={context} query={{ ...initialQuery(context.session), status: "ready", data: dashboard }} />);
  expect(screen.getByText("Server-recorded total: 0")).toBeOnTheScreen();
  expect(screen.queryByText("Someone else's report")).toBeNull();
  expect(screen.getByText("No award recorded. Acceptance and reward are separate.")).toBeOnTheScreen();
});
test("fixture public render path is visibly disconnected and disables operational commands", async () => {
  await render(<NativeFixturePreview surface="review" />);
  expect(screen.getByRole("header", { name: "Fixture preview — not connected to live backend" })).toBeOnTheScreen();
  expect(screen.getByText("Chất lượng ảnh: 75/100")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "AI nhận xét" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Accept report" })).toBeDisabled();
});
