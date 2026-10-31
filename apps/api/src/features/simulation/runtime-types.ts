import type { AdvanceJob } from "@floodops/contracts";
import type { SimulationPersistence } from "@floodops/domain/public-ports";
import type { SimulationPolicy, SimulationRun } from "@floodops/simulation";
import type { TransitionContext } from "../../shared/index";

export const ADVANCE_START = "simulation.advance.start";
export const ADVANCE_CHUNK = "simulation.advance.chunk";
export const CLOCK_VIEW = "simulation.clock";
export const JOBS_VIEW = "simulation.advance.jobs";
export interface AdvanceMaterial { jobId: string; leaseId: string; nonce: string }
export interface AdvanceRecord { job: AdvanceJob; leaseId: string; generation: number }
export interface AdvanceState { currentJobId: string | null; jobs: Record<string, AdvanceRecord> }
/** Private RPC result. Routers must expose only job, never execution material. */
export interface AdvanceReservation { job: AdvanceJob; execution: AdvanceMaterial }
export interface ChunkInput { job_id: string; lease_id: string; nonce: string }
export interface SimulationRuntimeOptions<State> {
  persistence: SimulationPersistence<SimulationRun, State>;
  committedPolicy?: (context: TransitionContext, run: Readonly<SimulationRun>) => SimulationPolicy | undefined;
  material?: () => AdvanceMaterial;
  leaseDurationMs?: number;
  maxBoundaries?: number;
  maxChunks?: number;
}
export interface ResolvedOptions<State> extends SimulationRuntimeOptions<State> {
  material: () => AdvanceMaterial;
  leaseDurationMs: number;
  maxBoundaries: number;
  maxChunks: number;
}
