import { createHash } from "node:crypto";
import { AdvanceJobSchema, parseSchema } from "@floodops/contracts";
import type { AdvanceInput } from "@floodops/contracts";
import { millisecondsToMinutes, minutesToMilliseconds } from "@floodops/simulation/clock";
import { fail } from "../../shared/index";
import type { DurableLease, ReducerDefinition } from "../../shared/index";
import { committedPolicy, readAdvanceState, readRun, saveAdvance } from "./state";
import type { AdvanceReservation, ResolvedOptions } from "./runtime-types";

export function startAdvance<State>(options: ResolvedOptions<State>): ReducerDefinition {
  return { permission: "simulation:advance", operational: true, validate: input => parseSchema("AdvanceInput", input),
    reduce(context, input) {
      const { snapshot, now } = context, run = readRun(context, options);
      if (snapshot.meta.status === "advancing" || snapshot.pointers.active_advance_job_id) fail(409, "ADVANCE_IN_PROGRESS", snapshot);
      const target = (input as AdvanceInput).target_sim_minute, targetMs = minutesToMilliseconds(target);
      if (targetMs <= run.nowMs || targetMs > run.scenario.horizonMs) fail(422, "INVALID_SCHEMA", snapshot);
      if (run.pendingTargetMs !== null && run.pendingTargetMs !== targetMs) fail(409, "STATE_CONFLICT", snapshot);
      committedPolicy(context, run, options);
      // Called only after generic authorization, idempotency replay and CAS have succeeded.
      const material = options.material();
      parseSchema("Id", material.jobId); parseSchema("Id", material.leaseId);
      if (!/^[A-Za-z0-9_-]{32,512}$/.test(material.nonce) || snapshot.leases[material.leaseId] || readAdvanceState(snapshot.values).jobs[material.jobId]) fail(503, "CONFIG_INCOMPLETE");
      const expires = now + options.leaseDurationMs, revision = snapshot.meta.revision + 1;
      const job = AdvanceJobSchema.parse({ advance_job_id: material.jobId, target_sim_minute: millisecondsToMinutes(targetMs),
        reached_sim_minute: millisecondsToMinutes(run.nowMs), status: "queued", revision,
        lease_expires_at: new Date(expires).toISOString(), error_code: null });
      const lease: DurableLease = { lease_id: material.leaseId, job_id: material.jobId, kind: "advance", generation: snapshot.meta.generation,
        revision, bind_revision: true, nonce_digest: createHash("sha256").update(material.nonce).digest("hex"), expires_at: expires, status: "active", error_code: null };
      const values = saveAdvance(snapshot.values, { job, leaseId: lease.lease_id, generation: lease.generation });
      return { data: { job, execution: material } satisfies AdvanceReservation,
        values: options.persistence.write(values, { ...run, pendingTargetMs: targetMs }), status: "advancing",
        pointers: { active_advance_job_id: material.jobId }, leases: [lease],
        events: [{ type: "advance_changed", resource_ids: [material.jobId] }] };
    }
  };
}
