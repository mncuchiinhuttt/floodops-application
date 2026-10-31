import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ReportForm } from "../src/features/reports/report-form";
import { newReportDraft, relinkDraft } from "../src/features/reports/report-draft";
import { fixtureContext } from "../preview/fixture-data";

const capturedAt = "2026-10-31T00:10:00Z";

test("mounted A to B capability change hides A draft fields immediately, without a storage effect", async () => {
  const owner = { ...fixtureContext("contributor"), online: true };
  const draft = newReportDraft(owner, capturedAt);
  draft.description = "Principal A private description";
  draft.segment = "seg_private01";
  draft.photo = { handle: "private-local-photo-A", label: "Principal A private photo" };
  const send = jest.fn(async () => undefined);
  const save = jest.fn(async () => undefined);
  const pick = jest.fn(async () => ({ kind: "cancelled" as const }));
  await render(<ReportForm context={owner} initialDraft={draft} onSubmit={send}
    photoPort={{ pick }} draftPort={{ save, load: async () => null }} />);
  expect(screen.getByDisplayValue(draft.description)).toBeOnTheScreen();
  expect(screen.getByText("Local photo: Principal A private photo")).toBeOnTheScreen();

  const other = { ...owner, participant: { ...owner.participant, participant_id: "par_other001", bound_entity_id: "con_other001" } };
  // No waitFor: the first committed render for B must already omit A's fields/media.
  await screen.rerender(<ReportForm context={other} initialDraft={draft} onSubmit={send}
    photoPort={{ pick }} draftPort={{ save, load: async () => null }} />);
  expect(screen.queryByDisplayValue(draft.description)).toBeNull();
  expect(screen.queryByDisplayValue(draft.segment)).toBeNull();
  expect(screen.queryByText("Local photo: Principal A private photo")).toBeNull();
  expect(screen.queryByLabelText("Description")).toBeNull();
  expect(screen.queryByRole("button", { name: "Re-link reviewed draft" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Choose photo" })).toBeNull();
  expect(screen.getByText(/This draft belongs to another principal/)).toBeOnTheScreen();
  expect(() => relinkDraft(draft, other)).toThrow(/another principal|Owner continuity/);
  expect(save).not.toHaveBeenCalled(); expect(pick).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
});

test("same-owner Reset keeps edited input and capture metadata until explicit reviewed relink and send", async () => {
  const owner = { ...fixtureContext("driver"), online: true };
  const draft = newReportDraft(owner, capturedAt);
  draft.description = "Before Reset";
  draft.segment = "seg_fixture01";
  draft.quick = "normal";
  draft.vehicles = ["motorbike"];
  const send = jest.fn(async () => undefined);
  const save = jest.fn(async () => undefined);
  await render(<ReportForm context={owner} initialDraft={draft} onSubmit={send} draftPort={{ save, load: async () => null }} />);
  await fireEvent.changeText(screen.getByLabelText("Description"), "Edited before Reset");

  const resetOwner = { ...owner, session: { ...owner.session, session_id: "ses_reset001", generation: owner.session.generation + 1, revision: 0, event_sequence: 0, sim_minute: 0 } };
  await screen.rerender(<ReportForm context={resetOwner} initialDraft={draft} onSubmit={send} draftPort={{ save, load: async () => null }} />);
  expect(screen.getByDisplayValue("Edited before Reset")).toBeOnTheScreen();
  expect(screen.getByDisplayValue(capturedAt)).toBeOnTheScreen();
  expect(screen.getByDisplayValue("10")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Send report" })).toBeDisabled();
  expect(send).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByRole("button", { name: "Re-link reviewed draft" }));
  expect(send).not.toHaveBeenCalled();
  expect(screen.getByDisplayValue(capturedAt)).toBeOnTheScreen();
  expect(screen.getByDisplayValue("10")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Send report" })).toBeEnabled();
  await fireEvent.press(screen.getByRole("button", { name: "Send report" }));
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  expect(send).toHaveBeenCalledWith(expect.objectContaining({
    kind: "driver", captured_at: capturedAt, captured_sim_minute: 10, description: "Edited before Reset", vehicle_types: ["motorbike"],
  }));
  expect(save).not.toHaveBeenCalled();
});
