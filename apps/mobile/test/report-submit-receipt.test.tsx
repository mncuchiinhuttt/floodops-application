import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { Report } from "@floodops/contracts";
import { ReportForm } from "../src/features/reports/report-form";
import { newReportDraft } from "../src/features/reports/report-draft";
import { captureTime } from "../src/features/reports/capture-time";
import { fixtureContext, fixtureReport } from "../preview/fixture-data";

const t0 = "2026-10-31T00:00:00Z";

test("a successful receipt survives its own revision refresh and blocks duplicate submit", async () => {
  const context = { ...fixtureContext("driver"), online: true };
  const draft = newReportDraft(context, captureTime(t0, context.session.sim_minute));
  draft.segment = "seg_fixture01"; draft.description = "Road report awaiting normalization"; draft.vehicles = ["motorbike"];
  let complete!: (value: Report) => void;
  const send = jest.fn(() => new Promise<Report>(resolve => { complete = resolve; }));
  const receipt: Report = { ...fixtureReport(), kind: "driver", input_mode: "text", media_id: null,
    participant_id: context.participant.participant_id, reporter_entity_id: context.participant.bound_entity_id!, status: "needs_clarification" };
  await render(<ReportForm context={context} initialDraft={draft} onSubmit={send} />);
  await fireEvent.press(screen.getByRole("button", { name: "Send report" }));
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  const refreshed = { ...context, session: { ...context.session, revision: context.session.revision + 1, event_sequence: context.session.event_sequence + 1 } };
  await screen.rerender(<ReportForm context={refreshed} initialDraft={draft} onSubmit={send} />);
  await act(async () => { complete(receipt); });
  expect(screen.getByText(`Report ${receipt.report_id}: needs_clarification. Reasons: None. Review and simulated awards remain separate server outcomes.`)).toBeOnTheScreen();
  expect(screen.queryByText(/Session changed during submission/)).toBeNull();
  expect(screen.getByRole("button", { name: "Send report" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Send report" }));
  expect(send).toHaveBeenCalledTimes(1);
  expect(screen.getByDisplayValue(draft.description)).toBeOnTheScreen();
});

test("only explicit Start new report clears sent input and takes capture defaults from the fresh scenario clock", async () => {
  let context = { ...fixtureContext("contributor"), online: true };
  const draft = newReportDraft(context, captureTime(t0, context.session.sim_minute));
  draft.segment = "seg_fixture01"; draft.longitude = "106.7"; draft.latitude = "10.7";
  draft.description = "Sent photo description"; draft.vehicles = ["motorbike"]; draft.fixturePhotoId = "pho_fixture01";
  const receipt = { ...fixtureReport(), status: "needs_clarification" as const };
  const send = jest.fn(async () => receipt);
  const createNewDraft = jest.fn(() => newReportDraft(context, captureTime(t0, context.session.sim_minute)));
  await render(<ReportForm context={context} initialDraft={draft} onSubmit={send} createNewDraft={createNewDraft} />);
  await fireEvent.press(screen.getByRole("button", { name: "Send report" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Start new report" })).toBeEnabled());
  expect(createNewDraft).not.toHaveBeenCalled();
  expect(screen.getByDisplayValue("Sent photo description")).toBeOnTheScreen();
  expect(screen.getByText("Permitted fixture: pho_fixture01")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Send report" })).toBeDisabled();

  context = { ...context, session: { ...context.session, sim_minute: 12.5, revision: context.session.revision + 1, event_sequence: context.session.event_sequence + 1 } };
  await screen.rerender(<ReportForm context={context} initialDraft={draft} onSubmit={send} createNewDraft={createNewDraft} />);
  await fireEvent.press(screen.getByRole("button", { name: "Start new report" }));
  expect(createNewDraft).toHaveBeenCalledTimes(1); expect(send).toHaveBeenCalledTimes(1);
  for (const field of ["Road segment", "Longitude", "Latitude", "Description"]) expect(screen.getByLabelText(field)).toHaveProp("value", "");
  expect(screen.getByLabelText("Capture time")).toHaveProp("value", "2026-10-31T00:12:30.000Z");
  expect(screen.getByLabelText("Capture simulation minute")).toHaveProp("value", "12.5");
  expect(screen.getByText("No photo selected")).toBeOnTheScreen();
  expect(screen.getByText("Vehicle scope: Unknown")).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Start new report" })).toBeNull();
  expect(screen.getByRole("button", { name: "Send report" })).toBeEnabled();
  expect(screen.queryByText(/Report rep_fixture01:/)).toBeNull();
});
