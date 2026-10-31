import type { Graph, Parameter, Route, ScenarioConfig, SegmentKnowledge, VehicleType, Quantity, Source, InputEvent, Observation, Restriction } from "@floodops/contracts";
import type { OperationState } from "@floodops/domain/operations";
import type { RoutingGraph } from "../graph/index.ts";

export type HashText = (text: string) => string;
export interface HubWindow { hubId: string; fromMinute: number; untilMinute: number; capacity: Quantity[] }
export interface ScenarioEvent {
  id: string; atMinute: number; sequence: number; afterIds: string[];
  kind: "knowledge" | "context" | "reopening";
  knowledge: SegmentKnowledge | null;
  supersedesRestrictionIds: string[];
}
/** Internal executable bundle; boundary entities remain canonical wire types. */
export interface ScenarioManifest {
  config: ScenarioConfig;
  graph: Graph;
  initial: OperationState;
  initialRoutes: Route[];
  initialKnowledge: SegmentKnowledge[];
  sourceSnapshot: { sources: Source[]; inputEvents: InputEvent[]; observations: Observation[]; restrictions: Restriction[] };
  events: ScenarioEvent[];
  hubWindows: HubWindow[];
  seed: string;
  datasetKind: "functional_fixture" | "calibrated_evaluation";
  licence: string;
  aliases: Record<string, string>;
  calibration: { holdoutId: string | null; trainingId: string | null; results: CalibrationCheck[] };
}
export interface CalibrationCheck {
  parameterKey: string; observed: number; expected: number; tolerance: number;
  sampleId: string; unit: string;
}
export interface LoadedScenario {
  readonly manifest: ScenarioManifest;
  readonly routing: RoutingGraph;
  readonly bundleHash: string;
  readonly horizonMs: number;
}
export interface CalibrationAssessment {
  status: "incomplete" | "validated" | "failed";
  missing: string[];
  failed: string[];
}
export function scopedParameter(parameters: readonly Parameter[], key: string, unit: string, vehicle?: VehicleType): Parameter {
  const parameter = parameters.find(item => item.key === key);
  if (!parameter || parameter.value === null || parameter.basis === "missing" || parameter.unit !== unit
    || (vehicle !== undefined && !parameter.vehicle_types.includes(vehicle))) throw new Error(`CONFIG_INCOMPLETE: parameter ${key}.`);
  return parameter;
}
