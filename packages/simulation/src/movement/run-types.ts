import type { Driver, SegmentKnowledge, Stop } from "@floodops/contracts";
import type { OperationState, AssignmentCandidate } from "@floodops/domain/operations";
import type { LoadedScenario } from "../scenario/scenario-types.ts";
export type BranchId = "static" | "floodops" | "reroute_only";
export interface DriverRuntime {
  segments: string[]; cursor: number; incoming: string | null;
  serviceEndMs: number | null; activeStop: Stop | null; wakeAtMs: number | null; needsReroute: boolean;
}
export interface BranchState { operations: OperationState; runtime: Record<string, DriverRuntime> }
export interface RunLog {
  sequence: number; atMinute: number; branch: BranchId | null;
  kind: "input" | "expiry" | "entry" | "arrival" | "service_start" | "pickup" | "delivery"
    | "blocked" | "in_progress_at_change" | "reassigned" | "eta_preview" | "executed_violation";
  driverId: string | null; orderId: string | null; segmentId: string | null;
  reason: string | null; attemptId: string | null; scope: "movement" | "proposal" | null;
  afterIncident: boolean; category: "road" | "feasibility" | null;
}
export interface PickupUsage { hubId: string; atMinute: number; orderId: string }
export interface SimulationRun {
  scenario: LoadedScenario; runId: string; nowMs: number;
  branches: Partial<Record<BranchId, BranchState>>;
  knowledge: SegmentKnowledge[]; inputCursor: number; incidentSeen: boolean;
  log: RunLog[]; nextSequence: number; pickupUsage: Partial<Record<BranchId, PickupUsage[]>>;
  pendingTargetMs: number | null;
}
export interface EntryContext {
  branch: BranchId; driver: Readonly<Driver>; segmentId: string; atMinute: number;
  knowledge: Readonly<SegmentKnowledge> | null;
}
export interface EntryDecision { allowed: boolean; reason: string }
/** SourcesMedia/PlannerSafety supply current knowledge and bound approval authority. */
export interface SimulationPolicy { authorizeEntry(context: EntryContext): EntryDecision }
export interface AdvanceResult { run: SimulationRun; complete: boolean; targetMinute: number }
export type SimulationCandidate = AssignmentCandidate;
