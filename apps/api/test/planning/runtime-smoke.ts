import { CONTRACT_VERSION, parseSchema } from "@floodops/contracts";
const base = "http://127.0.0.1:8786/api/v1";
let token = "", sessionId = "", etag = "";
const key = () => crypto.randomUUID();
async function call(path: string, body?: unknown, id = key(), expected = 200) {
  const response = await fetch(base + path, { method: body === undefined ? "GET" : "POST",
    headers: { ...(token ? { Authorization: "Bearer " + token } : {}), ...(body === undefined ? {} : {
      "Content-Type": "application/json", "Idempotency-Key": id, "X-Client-Request-Scope": key(), ...(etag ? { "If-Match": etag } : {}) }) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000) });
  if (response.status !== expected) throw new Error("Runtime smoke HTTP status " + response.status + " at " + path.replace(sessionId, "<session>"));
  return response;
}
const createdResponse = await call("/sessions", { scenario_id: "scn_functional1", scenario_version: "2", client_type: "native" }, key(), 201);
const created = parseSchema("SessionCreatedResponse", await createdResponse.json()).data!;
token = created.credential.access_token!; sessionId = created.session.session_id; etag = createdResponse.headers.get("ETag")!;
const prefix = "/sessions/" + sessionId;
const reserved = await call(prefix + "/planning-jobs", { cause: "manual", cause_entity_ids: [] }, key(), 202);
const job = parseSchema("PlanningJobResponse", await reserved.json()).data!;
let planId: string | null = null;
for (let i = 0; i < 100 && !planId; i++) {
  const current = parseSchema("PlanningJobResponse", await (await call(prefix + "/planning-jobs/" + job.job_id)).json()).data!;
  if (current.status === "failed") throw new Error("Runtime smoke planner failed:" + current.error_code);
  planId = current.plan_id; if (!planId) await new Promise(resolve => setTimeout(resolve, 20));
}
if (!planId) throw new Error("Runtime smoke job deadline exceeded.");
const plan = parseSchema("PlanResponse", await (await call(prefix + "/plans/" + planId)).json()).data!;
await call(prefix + "/plans/" + planId + "/decisions", { action_ids: plan.actions.map(a => a.action_id), decision: "approve", reason: "Local MVP smoke exact approval" });
const dry = parseSchema("DryRunResultResponse", await (await call(prefix + "/plans/" + planId + "/dry-runs",
  { group_ids: plan.groups.map(g => g.group_id) })).json()).data!;
const expectedCritical = dry.projected_branches.find(b => b.branch_id === "floodops")!.orders.find(o => o.order_id === "ord_order1")!.eta_minute;
if (!dry.feasible || expectedCritical === null || !Number.isFinite(expectedCritical) || expectedCritical <= 0) throw new Error("Expected genuine feasible projected critical ETA.");
const target = expectedCritical + 0.1;
const body = { group_ids: plan.groups.map(g => g.group_id) }, executeKey = key();
const firstResponse = await call(prefix + "/plans/" + planId + "/executions", body, executeKey, 201);
const execution = parseSchema("ExecutionResponse", await firstResponse.json()).data!;
const replay = parseSchema("ExecutionResponse", await (await call(prefix + "/plans/" + planId + "/executions", body, executeKey, 201)).json()).data!;
if (execution.execution_id !== replay.execution_id || execution.after_revision !== 1) throw new Error("Runtime smoke idempotency failed.");
etag = firstResponse.headers.get("ETag")!;
await call(prefix + "/simulation/advances", { target_sim_minute: target }, key(), 202);
let now = 0;
for (let i = 0; i < 100; i++) {
  const clock = parseSchema("SimulationClockResponse", await (await call(prefix + "/simulation")).json()).data!;
  now = clock.now_minute; if (clock.mode !== "advancing") {
    etag = (await call(prefix + "/simulation")).headers.get("ETag")!; break; } await new Promise(resolve => setTimeout(resolve, 20));
}
const operations = parseSchema("OperationsResponse", await (await call(prefix + "/operations")).json()).data!;
const order = operations.branches.find(b => b.branch_id === "floodops")!.orders.find(o => o.order_id === "ord_order1")!;
if (now !== target || order.delivered_at_minute !== expectedCritical) throw new Error("Runtime smoke actual movement failed.");
const incidentResponse = await call(prefix + "/incidents", { cause: "combined", fixture_incident_id: "inc_combined1" }, key(), 201);
const incident = parseSchema("IncidentResponse", await incidentResponse.json()).data!;
parseSchema("ImpactResponse", await (await call(prefix + "/impact")).json());
parseSchema("IncidentListResponse", await (await call(prefix + "/incidents")).json());
console.log(JSON.stringify({ incidentRecorded: incident.incident_id.length > 0, runtime: "actual local Hono/SQLite DO HTTP", planner: "actual deterministic bounded search; no model transport",
  contractVersion: CONTRACT_VERSION, scenarioVersion: created.session.scenario_version, plannerMetadata: job.planner,
  jobStatus: "completed", proposalStatus: plan.status, executeReplaySameId: true,
  executeRevision: execution.after_revision, advancedTo: now, predictedCriticalCompletion: expectedCritical, actualCriticalCompletion: order.delivered_at_minute,
  qualification: "Local M1 planner wire/runtime smoke; central legacy fences, Sources migration and full web/native acceptance remain separate." }, null, 2));
