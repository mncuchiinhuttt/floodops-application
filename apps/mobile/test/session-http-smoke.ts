/** Real local Workerd HTTP using native service/client. SecurePort is test-only, not device proof. */
import { ApiError, createIdempotencyKey } from "@floodops/api-client";
import manifest from "../../../data/scenarios/functional-v2/manifest.json";
import { createNativeApi, NativeSessionClient } from "../src/shared/native-client";
import { CredentialVault } from "../src/shared/native/credential-vault";
import { NativeSessionService } from "../src/features/session/runtime/session-service";
import { captureTime } from "../src/features/reports/capture-time";
import type { Identity } from "@floodops/contracts";
function participant() {
  const values = new Map<string, string>(); const vault = new CredentialVault({ available: async () => true, read: async key => values.get(key) ?? null,
    write: async (key, value) => { values.set(key, value); }, remove: async key => { values.delete(key); } }, Date.now);
  const api = createNativeApi("http://127.0.0.1:8790/api/v1", vault);
  return { vault, api, service: new NativeSessionService(api, vault, createIdempotencyKey) };
}
const owner = participant(); const catalog = await owner.api.request("listScenarios", {});
const scenario = catalog.body.data.items.find(item => item.scenario_id === manifest.config.scenario.scenario_id && item.version === manifest.config.scenario.version);
if (!scenario) throw new Error("Pinned canonical-v2 scenario absent from real catalog");
const identity = await owner.service.create(scenario.scenario_id, scenario.version);
if (identity.participant.role !== "dispatcher") throw new Error("Wrong created server capability");
const restored = await owner.service.restore(); if (restored.participant.participant_id !== identity.participant.participant_id) throw new Error("Rejoin changed principal");
const path = { session_id: identity.session.session_id };
const configuration = await owner.api.request("getSessionConfiguration", { path });
const graph = await owner.api.request("getSessionGraph", { path });
const driverId = manifest.initial.drivers[0]!.driver_id;
const invite = await owner.api.request("createInvitation", { path, headers: { "Idempotency-Key": createIdempotencyKey() }, body: { role: "driver", bound_entity_id: driverId, expires_in_seconds: 120 } });
const driver = participant(); let driverIdentity = await driver.service.claim(identity.session.session_id, invite.body.data.claim_token);
const context = (value: Identity) => ({ ...value, nowMs: Date.now(), online: true, freshness: "current" as const });
const segment = graph.body.data.segments.find(item => item.allowed_vehicle_types.includes(manifest.initial.drivers[0]!.vehicle_type));
if (!segment) throw new Error("No canonical driver segment");
const client = new NativeSessionClient(driver.api, context(driverIdentity));
const report = await client.submitReport({ kind: "driver", input_mode: "quick", quick_condition: "caution", segment_id: segment.segment_id,
  coordinate: null, captured_at: captureTime(configuration.body.data.t0, driverIdentity.session.sim_minute), captured_sim_minute: driverIdentity.session.sim_minute,
  vehicle_types: [manifest.initial.drivers[0]!.vehicle_type], description: "Native real HTTP quick report, disclosed synthetic scenario" }, createIdempotencyKey());
driverIdentity = await driver.service.restore();
const own = await driver.api.request("listReports", { path });
if (!own.body.data.items.some(item => item.report_id === report.body.data.report_id) || own.body.data.items.some(item => item.participant_id !== driverIdentity.participant.participant_id)) throw new Error("Own report scope failed");
try { await driver.api.request("getSessionSnapshot", { path }); throw new Error("Driver accessed dispatcher snapshot"); }
catch (error) { if (!(error instanceof ApiError) || error.status !== 403) throw error; }
let review: string;
try { await owner.api.request("reviewReport", { path: { ...path, report_id: report.body.data.report_id }, headers: { "If-Match": `"s:${path.session_id}:g:${driverIdentity.session.generation}:r:${driverIdentity.session.revision}"`, "Idempotency-Key": createIdempotencyKey() }, body: { decision: "reject", reason: "Native smoke checks missing review route", mapped_segment_id: null, vehicle_types: [], condition: null } }); review = "mounted"; }
catch (error) { if (!(error instanceof ApiError) || error.status !== 404) throw error; review = "404 NOT_FOUND (not mounted)"; }
await driver.vault.clear(); await owner.vault.clear();
console.log(JSON.stringify({ result: "PASS", catalog: "200 canonical-v2", native_session: "create/identity/rejoin/driver-claim", graph_config: "200", quick_report: report.body.data.status, quick_report_reasons: report.body.data.reason_codes, own_report_scope: "PASS", driver_snapshot: 403, manual_review: review, proof: "real local HTTP; injected SecurePort; no device proof" }));
