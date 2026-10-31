import type { Approval, Execution, Incident, Notification, Plan, PlanningJob, PlanningJobInput, Route, SessionMeta, ToolInput, Observation, VehicleType } from "@floodops/contracts";
import type { BranchId, SimulationRun } from "@floodops/simulation";
import type { SimulationPersistence } from "@floodops/domain/public-ports";
import type { TransitionContext } from "../../shared/index";
export interface CommittedMovementGrant {
  execution_id: string; plan_id: string; action_ids: string[];
  branch: BranchId; driver_id: string; route_id: string; segment_id: string; vehicle_type: VehicleType;
  knowledge_epoch: number; evidence_ids: string[]; basis: "ordinary_unknown" | "low"; expires_sim_minute: number;
}
export interface PlanningRecord {
  job: PlanningJob; leaseId: string; planId: string; capturedMeta: SessionMeta; attemptId?: string; capturedValues: Record<string, unknown>; input: PlanningJobInput;
}
export interface PlanningState {
  version: 1; session_id: string; generation: number;
  jobs: Record<string, PlanningRecord>; plans: Record<string, Plan>; routes: Record<string, Route>;
  approvals: Approval[]; approvalHistory: Approval[]; executions: Record<string, Execution>; notifications: Record<string, Notification>;
  incidents: Incident[]; committedRoutes: Record<string, string>; grants: CommittedMovementGrant[];
}
export interface PlanningMaterial { jobId: string; leaseId: string; planId: string; nonce: string }
export interface PlanningRuntimeOptions<State> {
  persistence: SimulationPersistence<SimulationRun, State>;
  provider?: CommanderProvider;
  model?: string; modelConfigHash?: string;
  material?: () => PlanningMaterial;
  deadlineMs?: number; maxTurns?: number; maxToolCalls?: number;
  observationProposal?: (context: TransitionContext, run: SimulationRun, input: ToolInput<"record_road_observation">) => Observation;
  validateCause?: (context: TransitionContext, run: SimulationRun, input: PlanningJobInput) => boolean;
}
export interface CommanderRequest { model: string; instructions: string; input: unknown[]; tools: unknown[]; signal: AbortSignal }
export interface CommanderProvider { respond(request: CommanderRequest): Promise<unknown> }
export interface ResolvedPlanningOptions<State> extends PlanningRuntimeOptions<State> {
  model: string; modelConfigHash: string; material: () => PlanningMaterial;
  deadlineMs: number; maxTurns: number; maxToolCalls: number;
}
export const PLANNING_KEY = "planning_runtime";
export const PLAN_START = "planning.start", PLAN_CANCEL = "planning.cancel", PLAN_BEGIN = "planning.begin", PLAN_COMPLETE = "planning.complete";
export const PLAN_DECIDE = "planning.decide", PLAN_DRY_RUN = "planning.dry-run", PLAN_EXECUTE = "planning.execute";
export const PLANNING_VIEW = "planning.state", OPERATIONS_VIEW = "planning.operations", INCIDENT_VIEW = "planning.incidents", IMPACT_VIEW = "planning.impact";
