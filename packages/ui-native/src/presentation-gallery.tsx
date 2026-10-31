import { useState } from "react";
import { Text, View } from "react-native";
import type { MapPresentation, PlanPresentation, SelectedImage } from "@floodops/design-tokens";
import { StatusBadge } from "./primitives/badge";
import { ImagePickerField } from "./primitives/image-picker-field";
import { styles } from "./primitives/styles";
import { CalibrationStatus, EvidenceSummary, MetricCard, SimulationBanner, SourceCard, Toast } from "./patterns/context";
import { MapCanvas, RouteSummary } from "./patterns/map";
import { PlanActionCard } from "./patterns/planning";
import { ReportForm, ReviewDecision } from "./patterns/reporting";
import { EventTimeline, GapCoverage, PointsLedger, ResultComparison } from "./patterns/results";
import { ResetControl } from "./patterns/confirmation";
// Display-coordinate examples only; no scenario physics or operational outcomes.
const scene: MapPresentation = {
  title: "Example map", width: 200, height: 120, scaleLabel: "Illustrative geometry only", vehicleLabel: "Motorbike",
  lines: [
    { id: "closed", label: "Example closed segment", points: [{ x: 10, y: 15 }, { x: 190, y: 15 }], state: { label: "Closed", tone: "closed" }, detail: "State supplied by consumer." },
    { id: "congestion", label: "Example congestion", points: [{ x: 10, y: 40 }, { x: 190, y: 40 }], state: { label: "Congestion", tone: "congestion" }, detail: "Vehicle scope remains explicit." },
    { id: "unknown", label: "Example unknown", points: [{ x: 10, y: 65 }, { x: 190, y: 65 }], state: { label: "Unknown", tone: "unknown" }, detail: "No passability inferred." },
    { id: "conflict", route: "alternative", label: "Example conflict", points: [{ x: 10, y: 90 }, { x: 190, y: 90 }], state: { label: "Conflict", tone: "conflict" }, detail: "Unresolved evidence remains labelled." }
  ], markers: [{ id: "hub", label: "Example hub", x: 10, y: 15, kind: "hub" }]
};
const plan: PlanPresentation = { id: "example-action", title: "Example plan action", phase: "projected", state: { label: "Blocked", tone: "blocked" },
  targetLabel: "Example order", dependencyGroupLabel: "Example group", riskLabel: "Unresolved evidence", evidenceIds: ["example-evidence"],
  reasons: [{ id: "reason", ruleId: "POL-01", label: "Closed segment", detail: "Only the server determines executability.", evidenceIds: ["example-evidence"] }],
  changes: [{ id: "eta", label: "Simulation ETA", committed: null, projected: "Example estimate" }] };
export function PresentationGallery() {
  const [caption, setCaption] = useState("");
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [message, setMessage] = useState("Local component examples only.");
  return <View style={styles.group}><SimulationBanner /><CalibrationStatus status="incomplete" detail="No independent calibration evidence in this gallery." />
    <SourceCard source={{ title: "Example source", provider: "Example provider", typeLabel: "Component evidence", provenance: "simulated", observedLabel: null, expiresLabel: null, vehicleLabel: "Motorbike only", freshness: { label: "Offline · cached stale data", tone: "unknown" } }} />
    <EvidenceSummary items={[{ id: "example-evidence", title: "Example observation", detail: "Expired evidence remains visible.", state: { label: "Stale", tone: "unknown" } }]} />
    <MapCanvas scene={scene} onSelectMarker={id => setMessage(`Selected marker: ${id}`)} />
    <RouteSummary route={{ title: "Example route", phase: "projected", etaLabel: null, detail: "No executable route implied.", segments: ["Example segment"] }} />
    <PlanActionCard plan={plan} />
    <ReportForm captionRequired caption={caption} onCaptionChange={setCaption} onSubmit={() => setMessage("Local submit example only.")} state={{ label: "Draft", tone: "unknown" }}>
      <ImagePickerField label="Example images" images={images} hint="Local selection example; no camera or upload."
        onPick={() => setImages([{ id: "example-image", label: "Example selected image" }])} onRemove={id => setImages(values => values.filter(image => image.id !== id))} />
    </ReportForm>
    <ReviewDecision reason={reason} onReasonChange={setReason} reasonRequired onDecision={decision => setMessage(`Local ${decision} example; no server mutation.`)} />
    <StatusBadge tone="ready" label="Accepted" /><StatusBadge tone="blocked" label="Rejected" />
    <GapCoverage gaps={[{ id: "gap", segmentLabel: "Example segment", vehicleLabel: "Motorbike", state: { label: "Pending review", tone: "pending" }, detail: "Coverage supplied, not computed here." }]} />
    <PointsLedger entries={[{ id: "award", label: "Example no-award entry", points: 0, reason: "No reward implied", timeLabel: "Example minute 5" }]} />
    <EventTimeline events={[{ id: "event", sequence: 7, timeLabel: "Example minute 5", actorLabel: "Example dispatcher", description: "Example sequence, not operational revision." }]} />
    <ResultComparison results={{ title: "Example result comparison", phase: "committed", horizonLabel: "Example H (no evaluation)", calibrationLabel: "Calibration incomplete", rows: [{ id: "ratio", label: "Example ratio", baseline: null, floodops: null }] }} />
    <MetricCard title="Unavailable example metric" value={null} phase="projected" />
    <ResetControl onConfirm={() => setMessage("Local reset example; no session mutation.")} /><Toast message={message} />
    <Text style={styles.hint}>Native device, camera, VoiceOver and TalkBack validation is separate.</Text>
  </View>;
}
