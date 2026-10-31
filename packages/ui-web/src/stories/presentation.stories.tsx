import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalibrationStatus, EvidenceSummary, EventTimeline, GapCoverage, MapCanvas, MetricCard, PlanActionCard, PointsLedger, ResetControl, ResultComparison, RouteSummary, SimulationBanner, SourceCard, Toast } from "../index";
import { evidence, plan, results, scene, source } from "./examples";
const meta = { title: "Presentation/Session" } satisfies Meta;
export default meta;
type Story = StoryObj;
function PresentationExample({ empty = false }: { empty?: boolean }) {
  const [selection, setSelection] = useState("None");
  const [resets, setResets] = useState(0);
  return <div className="grid gap-4"><SimulationBanner /><CalibrationStatus status="incomplete" detail="Example data has no independent calibration evidence." />
    <SourceCard source={source} /><EvidenceSummary items={empty ? [] : evidence} />
    <MapCanvas scene={empty ? { ...scene, lines: [], markers: [] } : scene} onSelectMarker={setSelection} /><Toast message={`Selected marker: ${selection}`} />
    <RouteSummary route={{ title: "Example route", phase: "projected", etaLabel: null, detail: "No executable route is implied.", segments: empty ? [] : ["Example segment"] }} />
    <PlanActionCard plan={empty ? { ...plan, changes: [], reasons: [], evidenceIds: [] } : plan} />
    <GapCoverage gaps={empty ? [] : [{ id: "gap", segmentLabel: "Example segment", vehicleLabel: "Motorbike", state: { label: "Pending review", tone: "pending" }, detail: "Coverage is supplied, not computed here." }]} />
    <PointsLedger entries={empty ? [] : [{ id: "award", label: "Example no-award entry", points: 0, reason: "No reward implied", timeLabel: "Example minute 5" }]} />
    <EventTimeline events={empty ? [] : [{ id: "event", sequence: 7, timeLabel: "Example minute 5", actorLabel: "Example dispatcher", description: "Component example event, not operational revision." }]} />
    <ResultComparison results={empty ? { ...results, rows: [] } : results} /><MetricCard title="Unavailable example metric" value={null} phase="projected" />
    <ResetControl onConfirm={() => setResets(value => value + 1)} /><Toast message={`Local reset examples: ${resets}`} />
  </div>;
}
export const Complete: Story = { render: () => <PresentationExample /> };
export const Empty: Story = { render: () => <PresentationExample empty /> };
export const Narrow: Story = { render: () => <div style={{ width: 320, maxWidth: "100%" }}><PresentationExample /></div> };
export const StaleOffline: Story = { render: () => <><SourceCard source={{ ...source, observedLabel: null, expiresLabel: null, freshness: { label: "Offline · cached stale data", tone: "unknown" } }} /><Toast message="Offline: refresh requires a connection." urgent /></> };
export const MapStates: Story = { render: () => <MapCanvas scene={scene} /> };

function SessionChangedReset() {
  const [disabledReason, setDisabledReason] = useState<string>();
  return <ResetControl disabledReason={disabledReason} onConfirm={() => {
    setDisabledReason("Session changed");
    throw new Error("Local component example failure");
  }} />;
}
export const CapabilityChange: Story = { render: () => <SessionChangedReset /> };
