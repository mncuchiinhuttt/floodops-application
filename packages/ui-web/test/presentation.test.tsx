import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CalibrationStatus, MapCanvas, MetricCard, ReportForm, PlanActionCard, PointsLedger, ResetControl, ResultComparison, ReviewDecision, SourceCard } from "../src/index";
import { plan, results, scene, source } from "../src/stories/examples";
afterEach(cleanup);
test("source state and map alternatives preserve explicit vehicle/staleness labels", () => {
  const select = vi.fn();
  render(<><SourceCard source={source} /><MapCanvas scene={scene} onSelectMarker={select} /></>);
  expect(screen.getByText("Motorbike only")).toBeDefined();
  expect(screen.getByText("Stale")).toBeDefined();
  expect(screen.getByRole("list", { name: "Map segments" }).children).toHaveLength(4);
  fireEvent.click(screen.getByRole("button", { name: "Example hub" }));
  expect(select).toHaveBeenCalledExactlyOnceWith("hub");
});
test("noninteractive markers stay text and projected plans never execute on render", () => {
  render(<><MapCanvas scene={scene} /><PlanActionCard plan={plan} /></>);
  expect(screen.queryByRole("button", { name: "Example hub" })).toBeNull();
  expect(screen.getByText("Projected · Action example-action")).toBeDefined();
  expect(screen.getByText("Rule POL-01")).toBeDefined();
  expect(screen.getByText("Approval is separate from Execute.")).toBeDefined();
  expect(screen.queryByRole("button", { name: /Execute/ })).toBeNull();
});
test("zero point entries remain zero while unavailable metrics stay null-labelled", () => {
  render(<><PointsLedger entries={[{ id: "zero", label: "Zero entry", points: 0, reason: "No award", timeLabel: "Minute 1" }, { id: "missing", label: "Missing entry", points: null, reason: "Unavailable result", timeLabel: "Minute 1" }]} />
    <ResultComparison results={results} /><MetricCard title="Unknown metric" value={null} /></>);
  const ledger = screen.getByRole("table", { name: "Simulated point entries" });
  expect(within(ledger).getByRole("cell", { name: "0", exact: true })).toBeDefined();
  expect(within(ledger).getByRole("cell", { name: "Unavailable", exact: true })).toBeDefined();
  expect(screen.getByText("Simulated")).toBeDefined();
  expect(within(screen.getByRole("table", { name: "Baseline and FloodOps" })).getAllByText("Unavailable")).toHaveLength(2);
});
function ReviewExample({ decide }: { decide: (decision: "accept" | "reject", reason: string) => void }) {
  const [reason, setReason] = useState("");
  return <ReviewDecision reason={reason} onReasonChange={setReason} onDecision={decide} reasonRequired />;
}
test("manual review retains reason and invokes only the chosen explicit callback", () => {
  const decide = vi.fn();
  render(<ReviewExample decide={decide} />);
  expect(decide).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Accept", exact: true }));
  expect(screen.getByRole("link", { name: "Enter a decision reason." })).toBeDefined();
  expect(document.activeElement).toBe(screen.getByRole("alert", { name: "Check the form" }));
  fireEvent.change(screen.getByLabelText("Decision reason (required)"), { target: { value: "Manual evidence check" } });
  fireEvent.click(screen.getByRole("button", { name: "Reject", exact: true }));
  expect(decide).toHaveBeenCalledExactlyOnceWith("reject", "Manual evidence check");
});
test("reset requires confirmation, starts on Cancel and preserves errors on failure", async () => {
  const reset = vi.fn().mockRejectedValue(new Error("internal secret example"));
  render(<ResetControl onConfirm={reset} />);
  const trigger = screen.getByRole("button", { name: "Reset", exact: true });
  trigger.focus(); fireEvent.click(trigger);
  const cancel = await screen.findByRole("button", { name: "Cancel" });
  await waitFor(() => expect(document.activeElement).toBe(cancel));
  expect(reset).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirm Reset", exact: true }));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Action did not complete. Review the current session and try again.");
  expect(reset).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("internal secret example")).toBeNull();
  fireEvent.click(cancel);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

function RequiredReport({ submit }: { submit: () => void }) {
  const [caption, setCaption] = useState("");
  return <ReportForm caption={caption} onCaptionChange={setCaption} onSubmit={submit} captionRequired state={{ label: "Draft", tone: "unknown" }} />;
}
test("required report caption blocks submit, focuses summary and preserves a correction", async () => {
  const submit = vi.fn();
  render(<RequiredReport submit={submit} />);
  fireEvent.click(screen.getByRole("button", { name: "Submit report" }));
  expect(submit).not.toHaveBeenCalled();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("alert", { name: "Check the form" })));
  fireEvent.click(screen.getByRole("link", { name: "Enter a report caption." }));
  const field = screen.getByLabelText("Report caption (required)") as HTMLTextAreaElement;
  expect(document.activeElement).toBe(field);
  fireEvent.change(field, { target: { value: "Retained report caption" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit report" }));
  expect(submit).toHaveBeenCalledTimes(1);
  expect(field.value).toBe("Retained report caption");
});
test("calibration failures have distinct text and blocked tone", () => {
  render(<CalibrationStatus status="failed" detail="Validation did not pass" />);
  expect(screen.getByText("Calibration failed")).toBeDefined();
  expect(screen.getByText("Validation did not pass")).toBeDefined();
});
test("proposed route keeps a separate visible conflict outer stroke", () => {
  const conflict = { ...scene.lines[3]!, route: "alternative" as const };
  const { container } = render(<MapCanvas scene={{ ...scene, lines: [conflict] }} />);
  const layers = container.querySelectorAll("svg[role=img] > g path");
  expect(layers).toHaveLength(3);
  expect(layers[0]!.getAttribute("stroke-dasharray")).toBe("2 2 8 2");
  expect(layers[0]!.getAttribute("stroke-width")).toBe("8");
  expect(layers[2]!.getAttribute("stroke-dasharray")).toBe("8 4");
  expect(screen.getByText("Outer stroke: segment state")).toBeDefined();
});
test("open confirmation responds to new disabled state and cannot dismiss a running request", async () => {
  let finish: (() => void) | undefined;
  const reset = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  const { rerender } = render(<ResetControl onConfirm={reset} />);
  fireEvent.click(screen.getByRole("button", { name: "Reset", exact: true }));
  rerender(<ResetControl onConfirm={reset} disabledReason="Session changed" />);
  const confirm = screen.getByRole("button", { name: "Confirm Reset", exact: true }) as HTMLButtonElement;
  expect(confirm.disabled).toBe(true);
  fireEvent.click(confirm); expect(reset).not.toHaveBeenCalled();
  rerender(<ResetControl onConfirm={reset} />);
  fireEvent.click(screen.getByRole("button", { name: "Confirm Reset", exact: true }));
  const cancel = screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement;
  expect(cancel.disabled).toBe(true);
  fireEvent.keyDown(cancel, { key: "Escape" }); fireEvent.click(cancel);
  expect(screen.getByRole("dialog", { name: "Reset simulation?" })).toBeDefined();
  expect(reset).toHaveBeenCalledTimes(1);
  finish!();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Reset", exact: true })));
});

test("capability loss restores focus to the named control group instead of a disabled trigger", async () => {
  const reset = vi.fn();
  const { rerender } = render(<ResetControl onConfirm={reset} />);
  fireEvent.click(screen.getByRole("button", { name: "Reset", exact: true }));
  rerender(<ResetControl onConfirm={reset} disabledReason="Session changed" />);
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel", exact: true })));
  fireEvent.click(screen.getByRole("button", { name: "Cancel", exact: true }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("group", { name: "Reset control" })));
  expect(reset).not.toHaveBeenCalled();
});
