import { createHash } from "node:crypto";
import { parseSchema } from "@floodops/contracts";
import type { PlanningJobInput, SessionMeta } from "@floodops/contracts";
import { fail } from "../../shared/index";
import type { DurableLease, ReducerDefinition } from "../../shared/index";
import { createCommittedMovementPolicy } from "./committed-policy";
import { casInput, idle, metadataCas, runtimeRun } from "./runtime-context";
import { planningValues, readPlanningState } from "./runtime-state";
import type { ResolvedPlanningOptions } from "./runtime-types";
export function startPlanning<State>(options: ResolvedPlanningOptions<State>): ReducerDefinition {
  return { permission: "planning:request", operational: false, validate(raw) {
    const envelope = casInput(raw); return { ...envelope, input: parseSchema("PlanningJobInput", envelope.input) };
  }, reduce(context, raw) {
    const request = raw as { input: PlanningJobInput; etag: string | null };
    metadataCas(context, request); idle(context);
    const state = readPlanningState(context.snapshot), run = runtimeRun(context, options), { snapshot, now } = context;
    if (request.input.cause === "incident" && (!request.input.cause_entity_ids.length
      || request.input.cause_entity_ids.some(id => !state.incidents.some(i => i.incident_id === id)))) fail(422, "UNKNOWN_ENTITY");
    if (request.input.cause === "accepted_report" && (!request.input.cause_entity_ids.length || request.input.cause_entity_ids.some(id =>
      !run.sourceSnapshot.observations.some(o => o.validation === "accepted" && o.observed_sim_minute <= run.nowMs / 60000 && o.evidence_ids.includes(id))))) fail(422, "UNKNOWN_ENTITY");
    if (request.input.cause === "conflict_resolved" && !options.validateCause) fail(503, "CONFIG_INCOMPLETE");
    if (options.validateCause && !options.validateCause(context, run, request.input)) fail(422, "UNKNOWN_ENTITY");
    createCommittedMovementPolicy(context, run);
    const previous = state.jobs[snapshot.pointers.latest_requested_job_id ?? ""];
    if (previous && ["queued", "running"].includes(previous.job.status) && previous.job.input_revision === snapshot.meta.revision
      && JSON.stringify(previous.input) === JSON.stringify(request.input)) return { data: { job: previous.job, execution: null }, events: [] };
    const material = options.material();
    ["jobId", "leaseId", "planId"].forEach(key => parseSchema("Id", material[key as keyof typeof material]));
    if (!/^[A-Za-z0-9_-]{32,512}$/.test(material.nonce) || state.jobs[material.jobId] || snapshot.leases[material.leaseId]) fail(503, "CONFIG_INCOMPLETE");
    const job = parseSchema("PlanningJob", { job_id: material.jobId, session_id: snapshot.meta.session_id,
      generation: snapshot.meta.generation, input_revision: snapshot.meta.revision, status: "queued", plan_id: null,
      error_code: null, model: options.model, model_config_hash: options.modelConfigHash,
      created_at: new Date(now).toISOString(), completed_at: null });
    // Remove old captures from this immutable input; keep actual committed facts/grants and other owners' state.
    const capturedValues = planningValues(snapshot, { ...state, jobs: {} });
    state.jobs[job.job_id] = { job, leaseId: material.leaseId, planId: material.planId, input: request.input,
      capturedValues, capturedMeta: structuredClone(snapshot.meta) as SessionMeta };
    const lease: DurableLease = { lease_id: material.leaseId, job_id: job.job_id, kind: "planning", generation: job.generation,
      revision: job.input_revision, bind_revision: true, nonce_digest: createHash("sha256").update(material.nonce).digest("hex"),
      expires_at: now + options.deadlineMs, status: "active", error_code: null };
    return { data: { job, execution: material }, values: planningValues(snapshot, state),
      pointers: { latest_requested_job_id: job.job_id, latest_plan_id: null }, leases: [lease],
      events: [{ type: "planning_job_changed", resource_ids: [job.job_id], audience: ["dispatcher"] }] };
  } };
}
