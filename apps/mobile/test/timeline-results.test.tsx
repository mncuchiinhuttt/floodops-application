import { fireEvent, render, screen } from "@testing-library/react-native";
import { TimelineScreen } from "../src/features/simulation/timeline-screen";
import { ResultsScreen } from "../src/features/results/results-screen";
import { initialQuery } from "../src/shared/query-state";
import { fixtureContext, fixtureResults } from "../preview/fixture-data";
const clock = { now_minute: 10, horizon_minute: 60, advance_job: null, mode: "paused" as const, playback_controls_are_view_only: true as const };
test("advance validates positive horizon delta and Reset confirmation is bound to the current session", async () => {
  const context = { ...fixtureContext(), online: true }; const advance = jest.fn(); const reset = jest.fn();
  await render(<TimelineScreen context={context} clock={clock} clockSession={context.session} events={[]} onAdvance={advance} onReset={reset} />);
  expect(screen.getByRole("button", { name: "Advance simulation" })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText("Advance minutes"), "5");
  await fireEvent.press(screen.getByRole("button", { name: "Advance simulation" })); expect(advance).toHaveBeenCalledWith(15);
  await fireEvent.press(screen.getByRole("button", { name: "Reset session" }));
  expect(screen.getByRole("button", { name: "Confirm Reset" })).toBeEnabled();
  const next = { ...context, session: { ...context.session, generation: 2 } };
  await screen.rerender(<TimelineScreen context={next} clock={clock} clockSession={context.session} events={[]} onAdvance={advance} onReset={reset} />);
  expect(screen.queryByRole("button", { name: "Confirm Reset" })).toBeNull();
  expect(screen.getByRole("button", { name: "Advance simulation" })).toBeDisabled(); expect(reset).not.toHaveBeenCalled();
});
test("results retain raw zero counts, unfinished runs and undefined reduction ratio", async () => {
  const context = fixtureContext(); const result = fixtureResults();
  await render(<ResultsScreen context={context} query={{ ...initialQuery(context.session), status: "ready", data: result }} />);
  expect(screen.getByText("Simulation result · Calibration incomplete")).toBeOnTheScreen();
  expect(screen.getByText(/Late reduction ratio: N\/A/)).toBeOnTheScreen();
  expect(screen.getAllByText("Run unfinished")).toHaveLength(2);
  expect(screen.getAllByText("total_late: 0")).toHaveLength(2);
  expect(screen.getAllByText("unfinished_count: 1")).toHaveLength(2);
});
