import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { MapPresentation, PlanPresentation, SelectedImage } from "@floodops/design-tokens";
import { CalibrationStatus, ImagePickerField, MapCanvas, ReportForm, PlanActionCard, PointsLedger, ResetControl, ResultComparison, ReviewDecision, SourceCard } from "../src/index";
const scene: MapPresentation = { title: "Example map", width: 100, height: 100, scaleLabel: "Illustrative units", vehicleLabel: "Car", lines: [
  { id: "closed", label: "Closed segment", points: [{ x: 10, y: 10 }, { x: 90, y: 10 }], state: { label: "Closed", tone: "closed" }, detail: "Explicit state" },
  { id: "conflict", route: "alternative", label: "Conflicting segment", points: [{ x: 10, y: 90 }, { x: 90, y: 90 }], state: { label: "Conflict", tone: "conflict" }, detail: "Unresolved evidence" }
], markers: [{ id: "car", label: "Example car", kind: "car", x: 10, y: 10 }] };
const plan: PlanPresentation = { id: "action", title: "Example action", phase: "projected", state: { label: "Blocked", tone: "blocked" }, targetLabel: "Order", dependencyGroupLabel: "Group", riskLabel: "Unknown", evidenceIds: ["evidence"], reasons: [{ id: "reason", ruleId: "POL-01", label: "Closed", detail: "Server gate applies", evidenceIds: ["evidence"] }], changes: [{ id: "eta", label: "ETA", committed: null, projected: "Example estimate" }] };
test("native map and source expose explicit state/vehicle data and marker actions", async () => {
  const select = jest.fn();
  await render(<><SourceCard source={{ title: "Source", provider: "Example provider", typeLabel: "Observation", provenance: "replayed", observedLabel: null, expiresLabel: null, vehicleLabel: "Car only", freshness: { label: "Stale", tone: "unknown" } }} />
    <MapCanvas scene={scene} onSelectMarker={select} /></>);
  expect(screen.getByText("Car only")).toBeOnTheScreen();
  expect(screen.getByLabelText("Stale")).toBeOnTheScreen();
  expect(screen.getByText("Closed segment")).toBeOnTheScreen();
  expect(screen.getByText("Conflicting segment")).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole("button", { name: "Example car" }));
  expect(select).toHaveBeenCalledWith("car");
  expect(select).toHaveBeenCalledTimes(1);
});
test("native projected action stays a presenter with separate approval/execution wording", async () => {
  await render(<PlanActionCard plan={plan} />);
  expect(screen.getByText("Projected · Action action")).toBeOnTheScreen();
  expect(screen.getByText("Rule POL-01")).toBeOnTheScreen();
  expect(screen.getByText("Approval is separate from Execute.")).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Execute" })).toBeNull();
});
test("native zero points remain distinct from unavailable result values", async () => {
  await render(<><PointsLedger entries={[{ id: "zero", label: "Zero entry", points: 0, reason: "No award", timeLabel: "Minute 1" }]} />
    <ResultComparison results={{ title: "Results", phase: "committed", horizonLabel: "Example H", calibrationLabel: "Calibration incomplete", rows: [{ id: "ratio", label: "Ratio", baseline: null, floodops: null }] }} /></>);
  expect(screen.getByText("0")).toBeOnTheScreen();
  expect(screen.getAllByText("Unavailable")).toHaveLength(2);
  expect(screen.getByLabelText("Simulated")).toBeOnTheScreen();
});
function ReviewExample({ decide }: { decide: (decision: "accept" | "reject", reason: string) => void }) {
  const [reason, setReason] = useState("");
  return <ReviewDecision reason={reason} onReasonChange={setReason} onDecision={decide} reasonRequired />;
}
test("native manual review retains input and calls only the explicitly chosen decision", async () => {
  const decide = jest.fn();
  await render(<ReviewExample decide={decide} />);
  expect(decide).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole("button", { name: "Accept", exact: true }));
  expect(screen.getByRole("button", { name: "Enter a decision reason." })).toBeOnTheScreen();
  expect(screen.getByRole("header", { name: "Check the form" })).toBeOnTheScreen();
  await fireEvent.changeText(screen.getByLabelText("Decision reason (required)"), "Manual evidence check");
  await fireEvent.press(screen.getByRole("button", { name: "Reject", exact: true }));
  expect(decide).toHaveBeenCalledWith("reject", "Manual evidence check");
  expect(decide).toHaveBeenCalledTimes(1);
});
function PickerExample() {
  const [images, setImages] = useState<SelectedImage[]>([]);
  return <ImagePickerField label="Example images" images={images} onPick={() => setImages([{ id: "one", label: "Example image" }])}
    onRemove={id => setImages(values => values.filter(image => image.id !== id))} />;
}
test("native image adapter exposes selected count and explicit removal", async () => {
  await render(<PickerExample />);
  await fireEvent.press(screen.getByRole("button", { name: "Choose Example images" }));
  expect(screen.getByText("1 selected image")).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole("button", { name: "Remove Example image" }));
  expect(screen.getByText("0 selected images")).toBeOnTheScreen();
});
test("native reset invokes no callback until confirmed and retains a safe failure message", async () => {
  const reset = jest.fn().mockRejectedValue(new Error("private internal example"));
  await render(<ResetControl onConfirm={reset} />);
  await fireEvent.press(screen.getByRole("button", { name: "Reset", exact: true }));
  expect(reset).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole("button", { name: "Confirm Reset", exact: true }));
  expect(screen.getByRole("alert")).toHaveTextContent("Action did not complete. Review the current session and try again.");
  expect(screen.queryByText("private internal example")).toBeNull();
  expect(reset).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByRole("button", { name: "Cancel", exact: true }));
  expect(screen.queryByRole("button", { name: "Confirm Reset", exact: true })).toBeNull();
});

function RequiredReport({ submit }: { submit: () => void }) {
  const [caption, setCaption] = useState("");
  return <ReportForm caption={caption} onCaptionChange={setCaption} onSubmit={submit} captionRequired state={{ label: "Draft", tone: "unknown" }} />;
}
test("native required report announces a summary, preserves caption and submits only a valid draft", async () => {
  const submit = jest.fn();
  await render(<RequiredReport submit={submit} />);
  await fireEvent.press(screen.getByRole("button", { name: "Submit report" }));
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByRole("header", { name: "Check the form" })).toBeOnTheScreen();
  await fireEvent.changeText(screen.getByLabelText("Report caption (required)"), "Retained report caption");
  await fireEvent.press(screen.getByRole("button", { name: "Submit report" }));
  expect(screen.getByDisplayValue("Retained report caption")).toBeOnTheScreen();
  expect(submit).toHaveBeenCalledTimes(1);
});
test("native calibration failure is distinct from unavailable calibration", async () => {
  await render(<CalibrationStatus status="failed" detail="Validation did not pass" />);
  expect(screen.getByText("Calibration failed")).toBeOnTheScreen();
  expect(screen.getByText("Validation did not pass")).toBeOnTheScreen();
});
test("native confirmation follows current pending and capability props while open", async () => {
  const reset = jest.fn();
  const view = await render(<ResetControl onConfirm={reset} />);
  await fireEvent.press(screen.getByRole("button", { name: "Reset", exact: true }));
  await view.rerender(<ResetControl onConfirm={reset} pending />);
  const cancel = screen.getByRole("button", { name: "Cancel", exact: true });
  expect(cancel).toBeDisabled();
  await fireEvent.press(cancel);
  expect(screen.getByRole("header", { name: "Reset simulation?" })).toBeOnTheScreen();
  await view.rerender(<ResetControl onConfirm={reset} disabledReason="Session changed" />);
  const confirm = screen.getByRole("button", { name: "Confirm Reset", exact: true });
  expect(confirm).toBeDisabled();
  await fireEvent.press(confirm);
  expect(reset).not.toHaveBeenCalled();
});
