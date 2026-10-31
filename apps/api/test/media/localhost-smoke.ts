import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseSchema } from "@floodops/contracts";
const base = "http://127.0.0.1:8785/api/v1";
const key = () => crypto.randomUUID().replaceAll("-", "");
async function request(path: string, init: RequestInit = {}, expected = 200): Promise<Response> {
  const response = await fetch(`${base}${path}`, init);
  if (response.status !== expected) throw new Error(`Local source smoke failed ${path.split("/").filter(Boolean).at(-1)} status ${response.status}`);
  return response;
}
const created = await request("/sessions", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key(),
  "X-Client-Request-Scope": key(), "CF-Connecting-IP": "192.0.2.44" }, body: JSON.stringify({ scenario_id: "scn_functional1", scenario_version: "1", client_type: "native" }) }, 201);
const createdData = parseSchema("SessionCreatedResponse", await created.json()).data!;
const prefix = `/sessions/${createdData.session.session_id}`, auth = { Authorization: `Bearer ${createdData.credential.access_token}` };
const config = parseSchema("ScenarioConfigResponse", await (await request(`${prefix}/configuration`, { headers: auth })).json()).data!;
const bytes = new Uint8Array(await readFile(new URL("../../../../data/scenarios/functional-v1/synthetic-report.png", import.meta.url)));
const reservation = await request(`${prefix}/media-uploads`, { method: "POST", headers: { ...auth, "Content-Type": "application/json", "Idempotency-Key": key() },
  body: JSON.stringify({ content_type: "image/png", byte_length: bytes.length, original_filename: "synthetic-smoke.png" }) }, 201);
const upload = parseSchema("MediaUploadResponse", await reservation.json()).data!;
await request(`${prefix}/media-uploads/${upload.upload_id}/content`, { method: "PUT", headers: { ...auth, "Content-Type": "application/octet-stream", "Idempotency-Key": key() }, body: bytes });
const completion = await request(`${prefix}/media-uploads/${upload.upload_id}/completion`, { method: "POST", headers: { ...auth, "Content-Type": "application/json", "Idempotency-Key": key() }, body: JSON.stringify({ confirm_uploaded: true }) }, 201);
const media = parseSchema("MediaResponse", await completion.json()).data!;
const derivative = await request(`${prefix}/media/${media.media_id}`, { headers: { ...auth, Origin: "https://floodops.test" } });
const digest = createHash("sha256").update(new Uint8Array(await derivative.arrayBuffer())).digest("hex");
if (digest !== media.sha256 || derivative.headers.get("X-Content-Type-Options") !== "nosniff") throw new Error("Local media derivative verification failed");
const submitted = await request(`${prefix}/reports`, { method: "POST", headers: { ...auth, "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": created.headers.get("ETag")! },
  body: JSON.stringify({ kind: "citizen", reporter_entity_id: "contributor_functional1", media_id: media.media_id, fixture_photo_id: null,
    segment_id: "seg_edge27", coordinate: [106.701,10.7705], captured_at: config.t0, captured_sim_minute: 0, vehicle_types: ["motorbike"], description: "Synthetic local pipeline smoke" }) }, 201);
const report = parseSchema("ReportResponse", await submitted.json()).data!;
if (report.status !== "pending_review" || report.award_id !== null || report.observation_ids.length) throw new Error("Local pending-report boundary failed");
console.log(JSON.stringify({ transport: "actual loopback HTTP/Workerd", calibration: config.scenario.calibration_status,
  seed_hash: config.seed_hash, config_hash: config.config_hash, graph_hash: config.graph_hash,
  media: { byte_length: media.byte_length, width: media.width, height: media.height, sha256: media.sha256 },
  report_status: report.status, observation_count: report.observation_ids.length, award_id: report.award_id,
  security_headers: derivative.headers.get("Cache-Control") === "no-store" && derivative.headers.get("X-Content-Type-Options") === "nosniff",
  cors_origin: derivative.headers.get("Access-Control-Allow-Origin") }, null, 2));
