import { AdvanceJobSchema, parseSchema } from "@floodops/contracts";
import type { SimulationRun } from "@floodops/simulation";
import { millisecondsToMinutes } from "@floodops/simulation/clock";
import { fail } from "../../shared/index";
import type { Snapshot, TransitionContext } from "../../shared/index";
import type { AdvanceRecord, AdvanceState, ResolvedOptions } from "./runtime-types";

const storageKey = "simulation_advances";
export function readAdvanceState(values: Record<string, unknown>): AdvanceState {
  const value = values[storageKey] as AdvanceState | undefined;
  if (!value) return { currentJobId: null, jobs: {} };
  if (!value.jobs || typeof value.jobs !== "object" || Array.isArray(value.jobs)) fail(503, "CONFIG_INCOMPLETE");
  if (value.currentJobId !== null) parseSchema("Id", value.currentJobId);
  for (const [id, record] of Object.entries(value.jobs)) {
    if (AdvanceJobSchema.parse(record.job).advance_job_id !== id || !Number.isSafeInteger(record.generation)) fail(503, "CONFIG_INCOMPLETE");
    parseSchema("Id", record.leaseId);
  }
  return value;
}
export function saveAdvance(values: Record<string, unknown>, record: AdvanceRecord, makeCurrent = true): Record<string, unknown> {
  const state = readAdvanceState(values);
  return { ...values, [storageKey]: { currentJobId: makeCurrent ? record.job.advance_job_id : state.currentJobId,
    jobs: { ...state.jobs, [record.job.advance_job_id]: record } } };
}
export function readRun<State>(context: TransitionContext, options: ResolvedOptions<State>): SimulationRun {
  const run = options.persistence.read(context.snapshot.values);
  const meta = context.snapshot.meta, reference = options.persistence.reference;
  if (meta.scenario_id !== reference.scenario_id || meta.scenario_version !== reference.scenario_version
    || run.scenario.bundleHash !== reference.bundle_hash || meta.horizon_minute !== run.scenario.manifest.config.horizon_minute
    || meta.sim_minute !== millisecondsToMinutes(run.nowMs)) fail(503, "CONFIG_INCOMPLETE");
  return run;
}
export function committedPolicy<State>(context: TransitionContext, run: Readonly<SimulationRun>, options: ResolvedOptions<State>) {
  const policy = options.committedPolicy?.(context, run);
  if (!policy || typeof policy.authorizeEntry !== "function") fail(503, "CONFIG_INCOMPLETE");
  return policy;
}
/** Metadata only. Platform reconciler owns unlocking and event emission. */
export function expireAdvance(snapshot: Snapshot, lease: Snapshot["leases"][string]): Record<string, unknown> {
  if (lease.kind !== "advance") return snapshot.values;
  const state = readAdvanceState(snapshot.values), record = state.jobs[lease.job_id];
  if (!record || record.leaseId !== lease.lease_id || !["queued", "running"].includes(record.job.status)) return snapshot.values;
  return saveAdvance(snapshot.values, { ...record, job: { ...record.job, status: "failed",
    revision: snapshot.meta.revision, lease_expires_at: null, error_code: lease.error_code === "STORAGE_UNAVAILABLE" ? "STORAGE_UNAVAILABLE" : "STATE_CONFLICT" } }, false);
}
