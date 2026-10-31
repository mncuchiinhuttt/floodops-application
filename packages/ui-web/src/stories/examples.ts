import type { EvidenceItem, MapPresentation, PlanPresentation, ResultsPresentation, SourcePresentation } from "@floodops/design-tokens";
// Synthetic component examples, not scenario fixtures, calibrated physics or live data.
export const source: SourcePresentation = { title: "Example source", provider: "Example provider", typeLabel: "Component evidence", provenance: "simulated", observedLabel: "Example minute 4", expiresLabel: "Example minute 8", vehicleLabel: "Motorbike only", freshness: { label: "Stale", tone: "unknown" } };
export const evidence: readonly EvidenceItem[] = [{ id: "example-evidence", title: "Example observation", detail: "Expired evidence remains visible with its state.", state: { label: "Stale", tone: "unknown" } }];
export const scene: MapPresentation = {
  title: "Example map", width: 200, height: 120, scaleLabel: "Illustrative geometry only", vehicleLabel: "Motorbike",
  lines: [
    { id: "closed", label: "Example closed segment", points: [{ x: 10, y: 15 }, { x: 190, y: 15 }], state: { label: "Closed", tone: "closed" }, detail: "Authoritative display state supplied by the consumer." },
    { id: "congestion", label: "Example congestion", points: [{ x: 10, y: 40 }, { x: 190, y: 40 }], state: { label: "Congestion", tone: "congestion" }, detail: "Vehicle scope remains explicit." },
    { id: "unknown", label: "Example unknown", points: [{ x: 10, y: 65 }, { x: 190, y: 65 }], state: { label: "Unknown", tone: "unknown" }, detail: "No passability inferred." },
    { id: "conflict", route: "alternative", label: "Example conflict", points: [{ x: 10, y: 90 }, { x: 190, y: 90 }], state: { label: "Conflict", tone: "conflict" }, detail: "Unresolved evidence remains labelled." }
  ], markers: [{ id: "hub", label: "Example hub", x: 10, y: 15, kind: "hub" }, { id: "bike", label: "Example motorbike", x: 190, y: 90, kind: "motorbike" }]
};
export const plan: PlanPresentation = {
  id: "example-action", title: "Example plan action", phase: "projected", state: { label: "Blocked", tone: "blocked" },
  targetLabel: "Example order", dependencyGroupLabel: "Example group", riskLabel: "Unresolved evidence",
  evidenceIds: ["example-evidence"], reasons: [{ id: "example-reason", ruleId: "POL-01", label: "Closed segment", detail: "Only the server can determine an executable action.", evidenceIds: ["example-evidence"] }],
  changes: [{ id: "eta", label: "Simulation ETA", committed: null, projected: "Example estimate" }]
};
export const results: ResultsPresentation = { title: "Example result comparison", phase: "committed", horizonLabel: "Example H (no evaluation)", calibrationLabel: "Calibration incomplete", rows: [{ id: "ratio", label: "Example ratio", baseline: null, floodops: null }] };
