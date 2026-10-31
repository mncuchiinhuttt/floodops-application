import { parseSchema, parseConsistentImageReviewAdvice, type ImageReviewJob } from "@floodops/contracts";
import { randomId } from "../shared/crypto";
import { fail, success } from "../shared/platform-error";
import type { Call, ImageBinding, ImageRecord, PlatformBindings, Proof, Reply, RuntimeRegistry, Snapshot } from "../shared/platform-types";
import { authenticate, touch } from "./auth";
import { appendEvents } from "./events";
import { rateLimit } from "./quotas";
import { parseQueuedImageFailure } from "./queued-image-failure";
import { Store } from "./store";
function matches(record: ImageRecord, current: ImageBinding | null | undefined, snapshot: Snapshot): boolean {
  const j = record.job;
  return !!current?.pending && current.report_id === j.report_id && current.input_digest === j.input_digest &&
    current.model === j.model && current.model_config_hash === j.model_config_hash && current.rubric_version === j.rubric_version &&
    snapshot.meta.session_id === j.session_id && snapshot.meta.generation === j.generation && ["active", "advancing"].includes(snapshot.meta.status);
}
function save(store: Store, snapshot: Snapshot, record: ImageRecord, now: number): void {
  parseSchema("ImageReviewJob", record.job);
  store.put("image_jobs", record.job.job_id, record);
  appendEvents(store, snapshot, [{ type: "image_review_changed", resource_ids: [record.job.report_id, record.job.job_id] }], now);
}
export function reconcileImages(store: Store, registry: RuntimeRegistry, now: number): void {
  const snapshot = store.get<Snapshot>("runtime", "snapshot");
  if (!snapshot) return;
  for (const record of store.list<ImageRecord>("image_jobs")) {
    if (["superseded", "failed"].includes(record.job.status)) continue;
    const currentId = store.get<string>("image_current", record.job.report_id);
    const current = registry.imageBinding?.(snapshot, record.job.report_id);
    if (currentId !== record.job.job_id || !matches(record, current, snapshot)) {
      record.job = { ...record.job, status: "superseded", result: null, error_code: null, completed_at: new Date(now).toISOString() };
      save(store, snapshot, record, now);
    } else if (["queued", "running"].includes(record.job.status) && (now >= record.leaseExpires || now >= Date.parse(record.job.deadline_at))) {
      record.job = { ...record.job, status: "failed", result: null, error_code: "MODEL_TIMEOUT", completed_at: new Date(now).toISOString() };
      save(store, snapshot, record, now);
    }
  }
}
export function imageCall(store: Store, registry: RuntimeRegistry, env: PlatformBindings, call: Call, proof: Proof | undefined,
  digest: string, now: number, lease: string, leaseDigest: string): Reply {
  const snapshot = store.snapshot();
  const actor = authenticate(store, snapshot, proof, env, now, call.kind !== "image-read", "reports:review");
  if (call.kind === "image-fail-queued" && actor.participant.role !== "dispatcher") fail(403, "FORBIDDEN");
  const reportId = call.name!;
  const current = registry.imageBinding?.(snapshot, reportId);
  if (!registry.imageBinding) fail(503, "CONFIG_INCOMPLETE");
  if (!current) fail(404, "NOT_FOUND");
  const currentId = store.get<string>("image_current", reportId);
  const previous = currentId ? store.get<ImageRecord>("image_jobs", currentId) : undefined;
  if (call.kind === "image-read") { touch(store, snapshot, now); return success(200, { report_id: reportId, job: previous?.job ?? null }, call.requestId, snapshot); }
  if (call.kind === "image-reserve") {
    parseSchema("ImageReviewJobInput", call.payload);
    const replay = store.replay(actor.participant.participant_id, call.key!, digest);
    if (replay) return replay;
    if (!current.pending) fail(409, "STATE_CONFLICT");
    rateLimit(store, actor, now);
    if (previous && matches(previous, current, snapshot) && ["queued", "running", "completed"].includes(previous.job.status)) {
      const reply = success(202, previous.job, call.requestId, snapshot);
      store.remember(actor.participant.participant_id, call.key!, digest, reply); return reply;
    }
    if (store.list<ImageRecord>("image_jobs").some(r => ["queued", "running"].includes(r.job.status))) fail(429, "RATE_LIMITED");
    if ((store.get<number>("runtime", "image_calls") ?? 0) >= 50) fail(429, "RATE_LIMITED");
    const job: ImageReviewJob = { job_id: randomId("imagejob"), session_id: snapshot.meta.session_id, generation: snapshot.meta.generation,
      report_id: reportId, input_digest: current.input_digest, model: current.model, model_config_hash: current.model_config_hash,
      rubric_version: current.rubric_version, status: "queued", result: null, error_code: null,
      created_at: new Date(now).toISOString(), deadline_at: new Date(now + 20000).toISOString(), completed_at: null };
    const record: ImageRecord = { job, leaseDigest, leaseExpires: now + 20000, started: false };
    store.put("image_current", reportId, job.job_id); save(store, snapshot, record, now);
    const reply = success(202, job, call.requestId, snapshot);
    store.remember(actor.participant.participant_id, call.key!, digest, reply);
    return { ...reply, effect: { job_id: job.job_id, lease } };
  }
  const input = call.payload as { job_id: string; lease: string; result?: unknown; error_code?: ImageReviewJob["error_code"] };
  const record = store.get<ImageRecord>("image_jobs", input.job_id);
  if (!record || record.job.report_id !== reportId) fail(404, "NOT_FOUND");
  if (record.leaseDigest !== leaseDigest || record.job.job_id !== currentId || !matches(record, current, snapshot)) fail(409, "STATE_CONFLICT");
  if (!["queued", "running"].includes(record.job.status) || now >= record.leaseExpires) fail(409, "STATE_CONFLICT");
  if (call.kind === "image-fail-queued") {
    const failure = parseQueuedImageFailure(call.payload);
    const deadline = Date.parse(record.job.deadline_at);
    if (record.job.status !== "queued" || record.started || !Number.isFinite(record.leaseExpires) || !Number.isFinite(deadline) || now >= deadline) fail(409, "STATE_CONFLICT");
    record.job = { ...record.job, status: "failed", result: null, error_code: failure.error_code, completed_at: new Date(now).toISOString() };
  } else if (call.kind === "image-start") {
    if (record.started) fail(409, "STATE_CONFLICT");
    const calls = store.get<number>("runtime", "image_calls") ?? 0;
    if (calls >= 50) fail(429, "RATE_LIMITED");
    store.put("runtime", "image_calls", calls + 1); record.started = true; record.job.status = "running";
  } else if (call.kind === "image-complete") {
    if (!record.started) fail(409, "STATE_CONFLICT");
    record.job = input.error_code ? { ...record.job, status: "failed", result: null, error_code: input.error_code, completed_at: new Date(now).toISOString() }
      : { ...record.job, status: "completed", result: parseConsistentImageReviewAdvice(input.result), error_code: null, completed_at: new Date(now).toISOString() };
  } else fail(404, "NOT_FOUND");
  save(store, snapshot, record, now);
  return success(200, record.job, call.requestId, snapshot);
}
