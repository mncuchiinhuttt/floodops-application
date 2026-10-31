import type { tokens } from "./tokens.native";
/** UI-only view models assembled by a consumer facade from frozen contracts.
 * These are not wire DTOs, schemas, safety decisions or authoritative state. */
export type DisplayValue = string | number | null;
export type PresentationPhase = "projected" | "committed";
export type PresentationState = { label: string; tone: keyof typeof tokens.semantic.status };
export type LabeledValue = { label: string; value: DisplayValue };
export type EvidenceItem = { id: string; title: string; detail: string; state: PresentationState };
export type SourcePresentation = {
  title: string; provider: string; typeLabel: string; provenance: keyof typeof tokens.semantic.provenance;
  observedLabel: string | null; expiresLabel: string | null; vehicleLabel: string; freshness: PresentationState;
};
export type MapPoint = { x: number; y: number };
export type MapLine = {
  id: string; label: string; points: readonly MapPoint[]; state: PresentationState; detail: string;
  route?: "primary" | "alternative";
};
export type MapMarker = {
  id: string; label: string; x: number; y: number; kind: "hub" | "parcel" | "motorbike" | "car";
};
export type MapPresentation = {
  title: string; width: number; height: number; scaleLabel: string; vehicleLabel: string;
  lines: readonly MapLine[]; markers: readonly MapMarker[];
};
export type RoutePresentation = {
  title: string; phase: PresentationPhase; etaLabel: string | null; detail: string; segments: readonly string[];
};
export type GateReasonPresentation = { id: string; ruleId: string; label: string; detail: string; evidenceIds: readonly string[] };
export type ComparisonRow = { id: string; label: string; committed: DisplayValue; projected: DisplayValue };
export type PlanPresentation = {
  id: string; title: string; phase: PresentationPhase; state: PresentationState; targetLabel: string;
  dependencyGroupLabel: string; riskLabel: string; reasons: readonly GateReasonPresentation[];
  evidenceIds: readonly string[]; changes: readonly ComparisonRow[];
};
export type GapPresentation = { id: string; segmentLabel: string; vehicleLabel: string; state: PresentationState; detail: string };
export type AwardPresentation = { id: string; label: string; points: number | null; reason: string; timeLabel: string };
export type EventPresentation = { id: string; sequence: number; timeLabel: string; actorLabel: string; description: string };
export type ResultRow = { id: string; label: string; baseline: DisplayValue; floodops: DisplayValue };
export type ResultsPresentation = {
  title: string; phase: PresentationPhase; horizonLabel: string; calibrationLabel: string; rows: readonly ResultRow[];
};
export type SelectedImage = { id: string; label: string };
