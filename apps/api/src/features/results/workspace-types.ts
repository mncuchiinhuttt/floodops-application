import type { Coverage, Impact, Knowledge, Operations, Plan, PlanningJob, Report, Route, SimulationClock } from "@floodops/contracts";
import type { SimulationPersistence } from "@floodops/domain/public-ports";
import type { SimulationRun } from "@floodops/simulation";
import type { TransitionContext } from "../../shared/index";
export interface WorkspacePlanning { plans: readonly Plan[]; jobs: readonly PlanningJob[] }
export interface WorkspaceReport { generation: number; report: Report }
/** Synchronous public DTO projections over the exact same server snapshot. No RPC or private-state imports. */
export interface WorkspaceProjectionPorts<State> {
  persistence: SimulationPersistence<SimulationRun, State>;
  clock: (context: TransitionContext) => SimulationClock;
  knowledge: (context: TransitionContext) => Knowledge;
  operations: (context: TransitionContext) => Operations;
  impact: (context: TransitionContext) => Impact;
  planning: (context: TransitionContext) => WorkspacePlanning;
  routes: (context: TransitionContext) => readonly Route[];
  reports: (context: TransitionContext) => readonly WorkspaceReport[];
  coverage: (context: TransitionContext) => Coverage;
}
