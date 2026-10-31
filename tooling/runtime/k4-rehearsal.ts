import { ApiClient, ApiError, nativeCredentials } from "@floodops/api-client";

const baseUrl = Bun.argv[2] ?? process.env.FLOODOPS_API_URL;
if (!baseUrl) throw new Error("Provide a local API URL as an argument or FLOODOPS_API_URL.");
const apiUrl = new URL(baseUrl);
if (apiUrl.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(apiUrl.hostname)
  || !apiUrl.pathname.replace(/\/$/, "").endsWith("/api/v1")) {
  throw new Error("K4 is a LOCAL rehearsal and only accepts a loopback HTTP API URL ending in /api/v1.");
}
const localApiUrl = apiUrl.toString().replace(/\/$/, "");
const key = () => crypto.randomUUID();
const localFetch = (input: string, init: RequestInit) => fetch(input, {
  ...init, signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000)
});
const bytes = new Uint8Array(await Bun.file(new URL("../../data/scenarios/functional-v2/synthetic-report.png", import.meta.url)).arrayBuffer());
interface Measurement { run: number; status: "complete" | "failure"; elapsed_ms: number | null; failure: string | null }

function pause(milliseconds: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, milliseconds);
  return promise;
}

async function run(index: number): Promise<Measurement> {
  let stage = "session-create", acceptedAt: number | null = null;
  const guest = new ApiClient({ baseUrl: localApiUrl, fetch: localFetch, credentials: () => ({ kind: "none" }), getRetry: { maxRetries: 0 } });
  let token = "", sessionId = "";
  try {
    stage = "scenario-catalog";
    const catalog = await guest.request("listScenarios", {});
    const scenario = catalog.body.data.items.find(item => item.version === "2");
    if (!scenario) throw new Error("functional-v2-not-advertised");
    stage = "session-create";
    const created = await guest.request("createSession", { headers: { "Idempotency-Key": key(), "X-Client-Request-Scope": key() },
      body: { scenario_id: scenario.scenario_id, scenario_version: scenario.version, client_type: "native" } });
    sessionId = created.body.data.session.session_id;
    token = created.body.data.credential.access_token!;
    const owner = new ApiClient({ baseUrl: localApiUrl, fetch: localFetch, credentials: nativeCredentials(() => token), getRetry: { maxRetries: 0 } });
    const path = () => ({ session_id: sessionId });
    const cas = async () => {
      const current = await owner.request("getSession", { path: path() });
      if (!current.etag) throw new Error("session-etag-missing");
      return current.etag;
    };

    stage = "scenario-config";
    const config = (await owner.request("getSessionConfiguration", { path: path() })).body.data;
    stage = "media-upload";
    const reserved = await owner.request("reserveMediaUpload", { path: path(), headers: { "Idempotency-Key": key() },
      body: { content_type: "image/png", byte_length: bytes.byteLength, original_filename: "functional-v2-synthetic-report.png" } });
    const uploadPath = { ...path(), upload_id: reserved.body.data.upload_id };
    await owner.request("uploadMediaContent", { path: uploadPath, headers: { "Idempotency-Key": key() }, body: bytes });
    const media = await owner.request("completeMediaUpload", { path: uploadPath, headers: { "Idempotency-Key": key() }, body: { confirm_uploaded: true } });
    stage = "report-submit";
    const submitted = await owner.request("submitReport", { path: path(), headers: { "Idempotency-Key": key(), "If-Match": await cas() },
      body: { kind: "citizen", reporter_entity_id: "contributor_functional1", media_id: media.body.data.media_id,
        fixture_photo_id: null, segment_id: "seg_edge27", coordinate: [106.701, 10.7705], captured_at: config.t0,
        captured_sim_minute: 0, vehicle_types: ["motorbike"], description: "Synthetic local K4 rehearsal report" } });
    stage = "manual-review";
    const reviewed = await owner.request("reviewReport", { path: { ...path(), report_id: submitted.body.data.report_id },
      headers: { "Idempotency-Key": key(), "If-Match": await cas() }, body: { decision: "accept",
        reason: "Manual acceptance before timed deterministic planning", mapped_segment_id: "seg_edge27",
        vehicle_types: ["motorbike"], condition: "normal" } });
    if (reviewed.body.data.report.status !== "accepted" || reviewed.body.data.report.observation_ids.length === 0) {
      throw new Error("manual-review-not-accepted");
    }
    acceptedAt = performance.now();

    stage = "planning-job";
    const started = await owner.request("createPlanningJob", { path: path(), headers: { "Idempotency-Key": key(), "If-Match": await cas() },
      body: { cause: "accepted_report", cause_entity_ids: [submitted.body.data.report_id] } });
    const jobId = started.body.data.job_id;
    const deadline = acceptedAt + 30000;
    let planId: string | null = null;
    while (performance.now() < deadline) {
      stage = "planning-job-poll";
      const job = (await owner.request("getPlanningJob", { path: { ...path(), job_id: jobId } })).body.data;
      if (job.status === "failed" || job.status === "cancelled") throw new Error("planning-job-terminal");
      if (job.plan_id) { planId = job.plan_id; break; }
      await pause(20);
    }
    if (!planId) throw new Error("planning-timeout");
    stage = "get-plan";
    const plan = (await owner.request("getPlan", { path: { ...path(), plan_id: planId } })).body.data;
    if (plan.plan_id !== planId || plan.is_projected !== true) throw new Error("plan-not-displayed");
    return { run: index, status: "complete", elapsed_ms: Number((performance.now() - acceptedAt).toFixed(3)), failure: null };
  } catch (error) {
    const failure = error instanceof ApiError ? `${stage}:api_${error.response.error.code}_${error.status}` : `${stage}:incomplete`;
    const elapsed = acceptedAt === null ? null : Number((performance.now() - acceptedAt).toFixed(3));
    return { run: index, status: "failure", elapsed_ms: elapsed, failure };
  }
}

const runs: Measurement[] = [];
for (let index = 1; index <= 10; index++) runs.push(await run(index));
const rank = Math.ceil(0.95 * runs.length);
const ranked = runs.map(result => result.status === "complete" ? result.elapsed_ms! : Number.POSITIVE_INFINITY).sort((a, b) => a - b);
const nearestRank = ranked[rank - 1]!;
const p95 = Number.isFinite(nearestRank) ? Number(nearestRank.toFixed(3)) : null;
const failures = runs.filter(result => result.status === "failure").length;
console.log(JSON.stringify({ qualification: "LOCAL rehearsal only; loopback Worker/API, functional-v2 synthetic report, deterministic planner; not production or calibrated performance evidence",
  start_point: "Client performance.now immediately after HTTP manual review returned accepted", end_point: "Client performance.now after getPlan returned the projected plan",
  p95_method: "nearest-rank ceil(0.95 * 10) = 10th measurement; each incomplete run ranks as +Infinity and remains in the denominator",
  sample_size: runs.length, denominator: runs.length, failures, p95_ms: p95,
  p95_target_ms: 10000, target_met: failures === 0 && p95 !== null && p95 <= 10000, runs }, null, 2));
if (failures > 0 || p95 === null || p95 > 10000) process.exitCode = 1;
