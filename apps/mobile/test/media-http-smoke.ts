/** Actual local media pipeline; no simulated backend or native hardware proof. */
import { ApiError, createIdempotencyKey } from "@floodops/api-client";
import { createNativeApi, NativeSessionClient } from "../src/shared/native-client";
import { CredentialVault } from "../src/shared/native/credential-vault";
import { NativeSessionService } from "../src/features/session/runtime/session-service";
import { uploadReportImage } from "../src/features/reports/data/media-upload";
import { captureTime } from "../src/features/reports/capture-time";
import type { Identity } from "@floodops/contracts";
function actor() {
  const values = new Map<string, string>(); const vault = new CredentialVault({ available: async () => true, read: async key => values.get(key) ?? null,
    write: async (key, value) => { values.set(key, value); }, remove: async key => { values.delete(key); } }, Date.now);
  const api = createNativeApi("http://127.0.0.1:8790/api/v1", vault);
  return { vault, api, service: new NativeSessionService(api, vault, createIdempotencyKey) };
}
const owner = actor(), contributor = actor(); const catalog = await owner.api.request("listScenarios", {}); const scenario = catalog.body.data.items[0];
if (!scenario) throw new Error("No server scenario");
const identity = await owner.service.create(scenario.scenario_id, scenario.version); const path = { session_id: identity.session.session_id };
const invite = await owner.api.request("createInvitation", { path, headers: { "Idempotency-Key": createIdempotencyKey() }, body: { role: "contributor", bound_entity_id: "contributor_functional1", expires_in_seconds: 120 } });
let current = await contributor.service.claim(identity.session.session_id, invite.body.data.claim_token);
const context = (value: Identity) => ({ ...value, nowMs: Date.now(), online: true, freshness: "current" as const });
const captured = context(current); const bytes = await Bun.file(new URL("../../../data/scenarios/functional-v2/synthetic-report.png", import.meta.url)).bytes();
try {
  const image = await uploadReportImage(contributor.api, bytes, () => context(current), captured, createIdempotencyKey);
  current = await contributor.service.restore();
  const configuration = await contributor.api.request("getSessionConfiguration", { path }); const graph = await contributor.api.request("getSessionGraph", { path });
  const segment = graph.body.data.segments[0]; if (!segment) throw new Error("No report segment");
  const result = await new NativeSessionClient(contributor.api, context(current)).submitReport({ kind: "citizen", media_id: image.mediaId, fixture_photo_id: null,
    segment_id: segment.segment_id, coordinate: null, captured_at: captureTime(configuration.body.data.t0, current.session.sim_minute), captured_sim_minute: current.session.sim_minute,
    vehicle_types: ["motorbike"], description: "Permitted synthetic image; actual native upload pipeline HTTP verification" }, createIdempotencyKey());
  const own = await contributor.api.request("listReports", { path });
  if (!own.body.data.items.some(report => report.report_id === result.body.data.report_id) || result.body.data.media_id !== image.mediaId) throw new Error("Normalized report scope mismatch");
  console.log(JSON.stringify({ result: "PASS", actual_http: "reserve201 -> binaryPUT200 -> normalized-ready201 -> citizen-report201 -> own-report200", report_status: result.body.data.status, report_reasons: result.body.data.reason_codes, device_proof: false }));
} catch (error) {
  if (!(error instanceof ApiError) || !["MEDIA_PROCESSING_UNAVAILABLE", "STORAGE_UNAVAILABLE"].includes(error.response.error.code)) throw error;
  console.log(JSON.stringify({ result: "BLOCKED", action: "actual image normalization/completion", status: error.status, code: error.response.error.code, device_proof: false, note: "No mock or fixture fallback was substituted" }));
} finally { await contributor.vault.clear(); await owner.vault.clear(); }
