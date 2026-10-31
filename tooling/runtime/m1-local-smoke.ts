import { ApiClient, ApiError, nativeCredentials } from "@floodops/api-client";
const baseUrl = "http://127.0.0.1:8760/api/v1", key = () => crypto.randomUUID();
const output: { stage: string; status: string; http?: number }[] = [];
let stage = "catalog", cleanup: (() => Promise<void>) | undefined;
function check(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function mark(name: string, http?: number) { output.push({ stage: name, status: "pass", ...(http ? { http } : {}) }); }
const wait = () => new Promise(resolve => setTimeout(resolve, 20));
async function run() {
  const guest = new ApiClient({ baseUrl, credentials: () => ({ kind: "none" }), getRetry: { maxRetries: 0 } });
  const catalog = await guest.request("listScenarios", {}), scenario = catalog.body.data.items.find(item => item.version === "2");
  check(scenario, "Canonical driver-ready v2 scenario not advertised"); mark(stage, catalog.status);
  stage = "create";
  const created = await guest.request("createSession", { headers: { "Idempotency-Key": key(), "X-Client-Request-Scope": key() },
    body: { scenario_id: scenario.scenario_id, scenario_version: scenario.version, client_type: "native" } });
  let sessionId = created.body.data.session.session_id;
  let token = created.body.data.credential.access_token;
  const owner = new ApiClient({ baseUrl, credentials: nativeCredentials(() => token), getRetry: { maxRetries: 0 } });
  const path = () => ({ session_id: sessionId });
  async function cas() { const meta = await owner.request("getSession", { path: path() }); check(meta.etag, "Missing server ETag"); return meta.etag; }
  cleanup = async () => { await owner.request("deleteSession", { path: path(), headers: { "Idempotency-Key": key(), "If-Match": await cas() } }); };
  mark(stage, created.status);
  const config = (await owner.request("getSessionConfiguration", { path: path() })).body.data;
  stage = "upload";
  const bytes = new Uint8Array(await Bun.file(new URL("../../data/scenarios/functional-v2/synthetic-report.png", import.meta.url)).arrayBuffer());
  const reserved = await owner.request("reserveMediaUpload", { path: path(), headers: { "Idempotency-Key": key() },
    body: { content_type: "image/png", byte_length: bytes.byteLength, original_filename: "project-authored-synthetic.png" } });
  const mediaPath = { ...path(), upload_id: reserved.body.data.upload_id };
  await owner.request("uploadMediaContent", { path: mediaPath, headers: { "Idempotency-Key": key() }, body: bytes });
  const media = await owner.request("completeMediaUpload", { path: mediaPath, headers: { "Idempotency-Key": key() }, body: { confirm_uploaded: true } });
  mark(stage, media.status);
  stage = "free-report";
  const submitted = await owner.request("submitReport", { path: path(), headers: { "Idempotency-Key": key(), "If-Match": await cas() },
    body: { kind: "citizen", reporter_entity_id: "contributor_functional1", media_id: media.body.data.media_id, fixture_photo_id: null,
      segment_id: "seg_edge27", coordinate: [106.701, 10.7705], captured_at: config.t0, captured_sim_minute: 0,
      vehicle_types: ["motorbike"], description: "Project-authored synthetic M1 workflow probe" } });
  check(submitted.body.data.status === "pending_review" && submitted.body.data.award_id === null, "Submission mutated review/award prematurely");
  mark(stage, submitted.status);
  if (Bun.argv.includes("--source-only")) return;
  stage = "manual-review";
  const reviewPath = { ...path(), report_id: submitted.body.data.report_id };
  const reviewed = await owner.request("reviewReport", { path: reviewPath, headers: { "Idempotency-Key": key(), "If-Match": await cas() },
    body: { decision: "accept", reason: "Synthetic manual workflow test; not model safety proof", mapped_segment_id: "seg_edge27", vehicle_types: ["motorbike"], condition: "normal" } });
  check(reviewed.body.data.report.status === "accepted" && reviewed.body.data.report.observation_ids.length > 0, "Manual review did not commit real evidence");
  mark(stage, reviewed.status);
  stage = "knowledge";
  const knowledge = await owner.request("getKnowledge", { path: path() });
  check(reviewed.body.data.report.observation_ids.every(id => knowledge.body.data.observations.some(item => item.observation_id === id)), "Reviewed observations absent from knowledge");
  mark(stage, knowledge.status);
  stage = "deterministic-plan";
  let job = (await owner.request("createPlanningJob", { path: path(), headers: { "Idempotency-Key": key(), "If-Match": await cas() },
    body: { cause: "accepted_report", cause_entity_ids: [submitted.body.data.report_id] } })).body.data;
  for (let i = 0; i < 100 && !["completed", "failed", "cancelled"].includes(job.status); i++) {
    await wait(); job = (await owner.request("getPlanningJob", { path: { ...path(), job_id: job.job_id } })).body.data;
  }
  check(job.status === "completed" && job.plan_id, "No completed deterministic proposal");
  let plan = (await owner.request("getPlan", { path: { ...path(), plan_id: job.plan_id } })).body.data;
  check(!["blocked", "rejected", "needs_replan"].includes(plan.status), "No feasible current candidate"); mark(stage);
  stage = "approval-not-execute";
  const before = await owner.request("getOperations", { path: path() });
  const actionIds = plan.actions.filter(action => action.status === "pending_approval").map(action => action.action_id);
  if (actionIds.length) await owner.request("decidePlanActions", { path: { ...path(), plan_id: plan.plan_id },
    headers: { "Idempotency-Key": key(), "If-Match": await cas() }, body: { action_ids: actionIds, decision: "approve", reason: "Explicit human test decision" } });
  const afterApproval = await owner.request("getOperations", { path: path() });
  check(JSON.stringify(before.body.data) === JSON.stringify(afterApproval.body.data), "Approval changed committed operations"); mark(stage);
  plan = (await owner.request("getPlan", { path: { ...path(), plan_id: plan.plan_id } })).body.data;
  const groups = plan.groups.filter(group => group.action_ids.every(id => plan.actions.some(a => a.action_id === id && a.status === "ready"))).map(group => group.group_id);
  check(groups.length, "No explicitly eligible group for execution");
  stage = "execute-and-replay";
  const executeInput = { path: { ...path(), plan_id: plan.plan_id }, headers: { "Idempotency-Key": key(), "If-Match": await cas() }, body: { group_ids: groups } };
  const executed = await owner.request("executePlan", executeInput), replay = await owner.request("executePlan", executeInput);
  check(executed.body.data.execution_id === replay.body.data.execution_id, "Execute retry duplicated effect"); mark(stage, executed.status);
  stage = "clock-results";
  const clock = await owner.request("getSimulationClock", { path: path() });
  const advanced = await owner.request("advanceSimulation", { path: path(), headers: { "Idempotency-Key": key(), "If-Match": await cas() },
    body: { target_sim_minute: Math.min(clock.body.data.horizon_minute, clock.body.data.now_minute + 1) } });
  check(advanced.body.data.status !== "failed", "Advance failed");
  const result = await owner.request("getResults", { path: path() });
  check(result.body.data.calibration_status === "incomplete", "Synthetic fixture claimed calibration"); mark(stage, result.status);
  stage = "reset-fence";
  const oldId = sessionId;
  const replacement = await owner.request("resetSession", { path: path(), headers: { "Idempotency-Key": key(), "If-Match": await cas() }, body: { client_type: "native", confirm: true } });
  sessionId = replacement.body.data.replacement.session.session_id; token = replacement.body.data.replacement.credential.access_token;
  check(sessionId !== oldId, "Reset reused session identity");
  try { await owner.request("getSession", { path: { session_id: oldId } }); throw new Error("Old session remained readable"); }
  catch (error) { check(error instanceof ApiError && [401, 403, 410].includes(error.status), "Old session fence failed"); }
  mark(stage, replacement.status);
}
try { await run(); }
catch (error) {
  output.push({ stage, status: error instanceof ApiError ? `blocked:${error.response.error.code}` : "failed:contract-or-invariant", ...(error instanceof ApiError ? { http: error.status } : {}) });
  process.exitCode = 1;
} finally {
  if (cleanup) try { await cleanup(); mark("cleanup"); } catch { output.push({ stage: "cleanup", status: "failed" }); process.exitCode = 1; }
  console.log(JSON.stringify({ qualification: "Actual loopback typed-client HTTP probe; not browser E2E, participant parity, expiry or live model proof", mode: Bun.argv.includes("--source-only") ? "source-only" : "M1-core", stages: output }, null, 2));
}
