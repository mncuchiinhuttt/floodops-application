import { createHash } from "node:crypto";
import { AdvanceJobSchema, parseSchema } from "@floodops/contracts";
import { advanceRun } from "@floodops/simulation";
import { millisecondsToMinutes, minutesToMilliseconds } from "@floodops/simulation/clock";
import { fail } from "../../shared/index";
import type { ReducerDefinition } from "../../shared/index";
import { committedPolicy, readAdvanceState, readRun, saveAdvance } from "./state";
import type { ChunkInput, ResolvedOptions } from "./runtime-types";

function parseChunk(value: unknown): ChunkInput {
  const input = value as ChunkInput;
  if (!input || typeof input !== "object" || Object.keys(input).sort().join(",") !== "job_id,lease_id,nonce"
    || typeof input.nonce !== "string" || !/^[A-Za-z0-9_-]{32,512}$/.test(input.nonce)) fail(422, "INVALID_SCHEMA");
  parseSchema("Id", input.job_id); parseSchema("Id", input.lease_id); return input;
}
export function continueAdvance<State>(options: ResolvedOptions<State>): ReducerDefinition {
  return { permission: "simulation:advance", operational: true, validate: parseChunk,
    reduce(context, input) {
      const value = input as ChunkInput, { snapshot, now } = context;
      const record = readAdvanceState(snapshot.values).jobs[value.job_id], lease = snapshot.leases[value.lease_id];
      // Mandatory reducer checks also fence a malformed internal call that omitted Call.fence.
      if (!record || !["queued", "running"].includes(record.job.status) || record.leaseId !== value.lease_id || record.generation !== snapshot.meta.generation
        || snapshot.meta.status !== "advancing" || snapshot.pointers.active_advance_job_id !== value.job_id
        || !lease || lease.job_id !== value.job_id || lease.kind !== "advance" || lease.status !== "active"
        || lease.generation !== snapshot.meta.generation || lease.revision !== snapshot.meta.revision || now >= lease.expires_at
        || lease.nonce_digest !== createHash("sha256").update(value.nonce).digest("hex")) fail(409, "STATE_CONFLICT", snapshot);
      const run = readRun(context, options);
      if (record.job.reached_sim_minute !== millisecondsToMinutes(run.nowMs)
        || run.pendingTargetMs !== minutesToMilliseconds(record.job.target_sim_minute)) fail(503, "CONFIG_INCOMPLETE");
      const advanced = advanceRun(run, record.job.target_sim_minute, committedPolicy(context, run, options), { maxBoundaries: options.maxBoundaries });
      const revision = snapshot.meta.revision + 1, reached = millisecondsToMinutes(advanced.run.nowMs);
      const job = AdvanceJobSchema.parse({ ...record.job, reached_sim_minute: reached, revision,
        status: advanced.complete ? "completed" : "running", lease_expires_at: advanced.complete ? null : record.job.lease_expires_at });
      return { data: job, values: options.persistence.write(saveAdvance(snapshot.values, { ...record, job }), advanced.run),
        simMinute: reached, status: advanced.complete ? "active" : "advancing",
        pointers: { active_advance_job_id: advanced.complete ? null : value.job_id },
        leases: [{ ...lease, revision, status: advanced.complete ? "completed" : "active" }],
        events: [{ type: "advance_changed", resource_ids: [value.job_id] }] };
    }
  };
}
