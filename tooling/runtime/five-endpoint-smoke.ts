import { ApiClient, nativeCredentials } from "@floodops/api-client";
const baseUrl = "http://127.0.0.1:8760/api/v1", key = () => crypto.randomUUID();
const rows: { operation: string; status: number }[] = [];
let cleanup: (() => Promise<void>) | undefined;
try {
  const guest = new ApiClient({ baseUrl, credentials: () => ({ kind: "none" }), getRetry: { maxRetries: 0 } });
  const selected = (await guest.request("listScenarios", {})).body.data.items.find(item => item.version === "2");
  if (!selected) throw new Error("Canonical scenario absent");
  const created = await guest.request("createSession", { headers: { "Idempotency-Key": key(), "X-Client-Request-Scope": key() },
    body: { scenario_id: selected.scenario_id, scenario_version: selected.version, client_type: "native" } });
  const path = { session_id: created.body.data.session.session_id };
  const api = new ApiClient({ baseUrl, credentials: nativeCredentials(() => created.body.data.credential.access_token), getRetry: { maxRetries: 0 } });
  cleanup = async () => {
    const meta = await api.request("getSession", { path });
    if (!meta.etag) throw new Error("Server ETag absent");
    await api.request("deleteSession", { path, headers: { "Idempotency-Key": key(), "If-Match": meta.etag } });
  };
  const conflicts = await api.request("listConflicts", { path, query: { limit: 10 } });
  rows.push({ operation: "listConflicts", status: conflicts.status });
  const gaps = await api.request("listGaps", { path, query: { limit: 10 } });
  rows.push({ operation: "listGaps", status: gaps.status });
  const coverage = await api.request("getCoverage", { path });
  rows.push({ operation: "getCoverage", status: coverage.status });
  const idempotencyKey = key(), input = { path, headers: { "Idempotency-Key": idempotencyKey },
    body: { kind: "deterministic_replay" as const, runs: 10 as const, scenario_id: selected.scenario_id, scenario_version: selected.version } };
  const started = await api.request("createEvaluationRun", input);
  rows.push({ operation: "createEvaluationRun", status: started.status });
  const replay = await api.request("createEvaluationRun", input);
  if (replay.body.data.evaluation_id !== started.body.data.evaluation_id) throw new Error("Evaluation replay duplicated a run");
  let evaluation = started.body.data;
  const evaluationPath = { ...path, evaluation_id: evaluation.evaluation_id };
  for (let index = 0; index < 600 && ["queued", "running"].includes(evaluation.status); index++) {
    await new Promise(resolve => setTimeout(resolve, 50));
    const fetched = await api.request("getEvaluationRun", { path: evaluationPath });
    evaluation = fetched.body.data;
    if (!rows.some(row => row.operation === "getEvaluationRun")) rows.push({ operation: "getEvaluationRun", status: fetched.status });
  }
  if (!rows.some(row => row.operation === "getEvaluationRun")) {
    const fetched = await api.request("getEvaluationRun", { path: evaluationPath });
    rows.push({ operation: "getEvaluationRun", status: fetched.status }); evaluation = fetched.body.data;
  }
  if (evaluation.status !== "completed" || evaluation.trials.length !== 10 || evaluation.is_real_model !== false)
    throw new Error("No complete ten-trial deterministic replay result");
  console.log(JSON.stringify({ scope: "Actual local five-route HTTP smoke, not overall business/quality acceptance", rows,
    kind: evaluation.kind, trials: evaluation.trials.length, valid_first_proposals: evaluation.valid_first_proposals,
    is_real_model: evaluation.is_real_model, evaluation_replay_same_id: true }, null, 2));
} catch { console.log(JSON.stringify({ scope: "five-route HTTP smoke", rows, result: "failed-or-blocked" })); process.exitCode = 1; }
finally {
  if (cleanup) try { await cleanup(); console.log("synthetic_endpoint_probe_cleanup=pass"); }
  catch { console.log("synthetic_endpoint_probe_cleanup=failed"); process.exitCode = 1; }
}
