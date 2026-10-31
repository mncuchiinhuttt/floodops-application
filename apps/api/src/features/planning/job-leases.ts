import { createHash } from "node:crypto";
import { fail } from "../../shared/index";
import type { DurableLease, Snapshot, TransitionContext } from "../../shared/index";
import type { PlanningRecord } from "./runtime-types";
import { planningValues, readPlanningState } from "./runtime-state";
export interface JobAuthority { job_id: string; lease_id: string; nonce: string; attempt_id: string }
export function jobAuthority(raw: unknown): JobAuthority {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail(422, "INVALID_SCHEMA");
  const v = raw as Record<string, unknown>;
  if (["job_id", "lease_id", "nonce", "attempt_id"].some(key => typeof v[key] !== "string")
    || Object.keys(v).some(key => !["job_id", "lease_id", "nonce", "attempt_id", "proposal", "error_code", "search"].includes(key))) fail(422, "INVALID_SCHEMA");
  return v as unknown as JobAuthority;
}
export function assertJobAuthority(context: TransitionContext, record: PlanningRecord, input: JobAuthority): DurableLease {
  const lease = context.snapshot.leases[input.lease_id];
  if (!lease || record.leaseId !== input.lease_id || lease.job_id !== input.job_id || lease.kind !== "planning"
    || lease.status !== "active" || context.now >= lease.expires_at || lease.generation !== context.snapshot.meta.generation
    || createHash("sha256").update(input.nonce).digest("hex") !== lease.nonce_digest) fail(409, "STATE_CONFLICT", context.snapshot);
  if (record.job.input_revision !== context.snapshot.meta.revision || lease.revision !== context.snapshot.meta.revision) fail(412, "REVISION_MISMATCH", context.snapshot);
  if (context.snapshot.pointers.latest_requested_job_id !== input.job_id) fail(409, "STALE_PROPOSAL", context.snapshot);
  return lease;
}
export function expirePlanning(snapshot: Snapshot, lease: DurableLease, now: number): Record<string, unknown> {
  if (lease.kind !== "planning") return snapshot.values;
  const state = readPlanningState(snapshot), record = state.jobs[lease.job_id];
  if (!record || record.leaseId !== lease.lease_id || !["queued", "running"].includes(record.job.status)) return snapshot.values;
  record.job = { ...record.job, status: lease.status === "superseded" ? "superseded" : "failed",
    error_code: lease.status === "superseded" ? null : "MODEL_TIMEOUT", completed_at: new Date(now).toISOString() };
  return planningValues(snapshot, state);
}
