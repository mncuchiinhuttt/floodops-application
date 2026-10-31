import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ReportForm } from "../src/features/reports/report-form";
import { buildReportInput, draftNeedsRelink, newReportDraft, relinkDraft } from "../src/features/reports/report-draft";
import { fixtureContext } from "../preview/fixture-data";
const capturedAt = "2026-10-31T00:10:00Z";
test.each(["denied", "cancelled", "unavailable"] as const)("photo %s preserves typed draft without submission", async kind => {
  const context = { ...fixtureContext("contributor"), online: true }; const send = jest.fn(async () => undefined);
  await render(<ReportForm context={context} initialDraft={newReportDraft(context, capturedAt)} onSubmit={send} photoPort={{ pick: async () => ({ kind }) }} />);
  await fireEvent.changeText(screen.getByLabelText("Description"), "Retain this report");
  await fireEvent.changeText(screen.getByLabelText("Longitude"), "106.7");
  await fireEvent.press(screen.getByRole("button", { name: "Choose photo" }));
  await waitFor(() => expect(screen.getByText(`Photo ${kind}. Your draft is preserved.`)).toBeOnTheScreen());
  expect(screen.getByDisplayValue("Retain this report")).toBeOnTheScreen();
  expect(screen.getByDisplayValue("106.7")).toBeOnTheScreen(); expect(screen.getByDisplayValue(capturedAt)).toBeOnTheScreen();
  expect(send).not.toHaveBeenCalled();
});
test("driver quick report edits produce exact C1 body without granting a reporter identity", async () => {
  const context = { ...fixtureContext("driver"), online: true }; const send = jest.fn(async () => undefined);
  await render(<ReportForm context={context} initialDraft={newReportDraft(context, capturedAt)} onSubmit={send} />);
  await fireEvent.changeText(screen.getByLabelText("Road segment"), "seg_fixture01");
  await fireEvent.changeText(screen.getByLabelText("Description"), "Dry at capture time");
  await fireEvent.press(screen.getByRole("button", { name: "Dry road" }));
  await fireEvent.press(screen.getByRole("button", { name: "Toggle motorbike" }));
  await fireEvent.press(screen.getByRole("button", { name: "Send report" }));
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  expect(send).toHaveBeenCalledWith({ kind: "driver", input_mode: "quick", quick_condition: "normal", segment_id: "seg_fixture01", coordinate: null,
    captured_at: capturedAt, captured_sim_minute: 10, vehicle_types: ["motorbike"], description: "Dry at capture time" });
});
test("offline draft can save only through injected app-private storage and never sends", async () => {
  const context = fixtureContext("contributor"); const send = jest.fn(async () => undefined); const save = jest.fn(async () => undefined);
  await render(<ReportForm context={context} initialDraft={newReportDraft(context, capturedAt)} onSubmit={send} draftPort={{ save, load: async () => null }} />);
  await fireEvent.changeText(screen.getByLabelText("Description"), "Offline draft");
  expect(screen.getByRole("button", { name: "Send report" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Send report" }));
  await fireEvent.press(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ description: "Offline draft", capturedAt })));
  expect(send).not.toHaveBeenCalled();
});
test("Reset draft requires explicit reviewed relink without changing original capture", async () => {
  const context = { ...fixtureContext("contributor"), online: true }; const draft = newReportDraft(context, capturedAt);
  draft.fixturePhotoId = "pho_fixture01"; draft.segment = "seg_fixture01";
  const next = { ...context, session: { ...context.session, generation: 2 } };
  expect(draftNeedsRelink(draft, next)).toBe(true); expect(() => buildReportInput(draft, next)).toThrow(/Stale session/);
  const relinked = relinkDraft(draft, next); expect(relinked.capturedAt).toBe(capturedAt); expect(relinked.simMinute).toBe("10");
  const send = jest.fn(async () => undefined);
  await render(<ReportForm context={next} initialDraft={draft} onSubmit={send} />);
  expect(screen.getByRole("button", { name: "Send report" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Re-link reviewed draft" }));
  expect(send).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole("button", { name: "Send report" }));
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
});
test("late successful submission after Reset cannot show success in the new session", async () => {
  const context = { ...fixtureContext("driver"), online: true }; const draft = newReportDraft(context, capturedAt);
  draft.segment = "seg_fixture01"; draft.description = "Original draft";
  let complete!: () => void; const send = jest.fn(() => new Promise<void>(resolve => { complete = resolve; }));
  await render(<ReportForm context={context} initialDraft={draft} onSubmit={send} />);
  await fireEvent.press(screen.getByRole("button", { name: "Send report" }));
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  await screen.rerender(<ReportForm context={{ ...context, session: { ...context.session, generation: 2 } }} initialDraft={draft} onSubmit={send} />);
  await act(async () => { complete(); });
  expect(screen.queryByText(/Report submitted to the server\./)).toBeNull();
  expect(screen.getByText(/Session changed during submission/)).toBeOnTheScreen();
  expect(screen.getByDisplayValue("Original draft")).toBeOnTheScreen();
});
test("invalid coordinates/required photo stay local; missing ports never claim persistence", async () => {
  const context = { ...fixtureContext("contributor"), online: true }; const draft = newReportDraft(context, capturedAt);
  draft.longitude = "181"; draft.latitude = "10"; draft.fixturePhotoId = "pho_fixture01";
  expect(() => buildReportInput(draft, context)).toThrow();
  draft.longitude = "106.7"; draft.latitude = "10.7";
  expect(buildReportInput(draft, context).coordinate).toEqual([106.7, 10.7]);
  draft.fixturePhotoId = null;
  expect(() => buildReportInput(draft, context)).toThrow(/verified photo/);
  await render(<ReportForm context={context} initialDraft={draft} />);
  expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Send report" })).toBeDisabled();
});

test("in-flight submission freezes the visible vehicle/quick inputs until completion", async () => {
  const context = { ...fixtureContext("driver"), online: true }; const draft = newReportDraft(context, capturedAt);
  draft.segment = "seg_fixture01"; draft.description = "Frozen report"; draft.quick = "normal"; draft.vehicles = ["motorbike"];
  let complete!: () => void; const send = jest.fn(() => new Promise<void>(resolve => { complete = resolve; }));
  await render(<ReportForm context={context} initialDraft={draft} onSubmit={send} />);
  await fireEvent.press(screen.getByRole("button", { name: "Send report" }));
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("button", { name: "Toggle car" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Deep water / impassable" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Toggle car" }));
  await fireEvent.press(screen.getByRole("button", { name: "Deep water / impassable" }));
  expect(screen.getByText("Vehicle scope: motorbike")).toBeOnTheScreen();
  expect(screen.getByText("Quick condition: normal")).toBeOnTheScreen();
  await act(async () => { complete(); });
});
