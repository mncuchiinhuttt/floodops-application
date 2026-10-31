/** Real Workerd/native API flows; injected SecurePort is test-only, not device proof. */
import { ApiError, createIdempotencyKey } from "@floodops/api-client";
import { assertReceiptRewardPolicyUnchanged } from "@floodops/contracts";
import manifest from "../../../data/scenarios/functional-v2/manifest.json";
import { NativeSessionClient } from "../src/shared/native-client";
import { captureTime } from "../src/features/reports/capture-time";
import { nativeActor, nativeContext, runNativeProbe } from "./m1-http-probe";
const owner = nativeActor(), driver = nativeActor();
try { await runNativeProbe("m1-native-session-report-review", async step => {
  const catalog = await step("GET scenarios", () => owner.api.request("listScenarios", {}));
  const scenario = catalog.body.data.items.find(item => item.scenario_id === manifest.config.scenario.scenario_id && item.version === manifest.config.scenario.version);
  if (!scenario) throw new Error("Pinned canonical-v2 scenario absent");
  const identity = await step("POST canonical-v2 native session", () => owner.service.create(scenario.scenario_id, scenario.version));
  const restored = await step("GET native identity/restore", () => owner.service.restore());
  if (restored.participant.participant_id !== identity.participant.participant_id) throw new Error("Restore changed principal");
  const path = { session_id: identity.session.session_id };
  const configuration = await step("GET configuration", () => owner.api.request("getSessionConfiguration", { path }));
  const graph = await step("GET graph", () => owner.api.request("getSessionGraph", { path }));
  const invite = await step("POST driver invitation", () => owner.api.request("createInvitation", { path, headers: { "Idempotency-Key": createIdempotencyKey() }, body: { role: "driver", bound_entity_id: manifest.initial.drivers[0]!.driver_id, expires_in_seconds: 120 } }));
  let current = await step("POST native driver claim", () => driver.service.claim(identity.session.session_id, invite.body.data.claim_token));
  await step("GET dispatcher snapshot with driver capability rejects403", async () => {
    try { await driver.api.request("getSessionSnapshot", { path }); throw new Error("Driver accessed dispatcher snapshot"); }
    catch (error) { if (!(error instanceof ApiError) || error.status !== 403) throw error; }
  });
  const segment = graph.body.data.segments.find(item => item.allowed_vehicle_types.includes(manifest.initial.drivers[0]!.vehicle_type));
  if (!segment) throw new Error("No canonical driver segment");
  const report = await step("POST driver quick report (strict M1 DTO)", () => new NativeSessionClient(driver.api, nativeContext(current)).submitReport({ kind: "driver", input_mode: "quick", quick_condition: "caution", segment_id: segment.segment_id,
    coordinate: null, captured_at: captureTime(configuration.body.data.t0, current.session.sim_minute), captured_sim_minute: current.session.sim_minute,
    vehicle_types: [manifest.initial.drivers[0]!.vehicle_type], description: "Native actual HTTP quick report; disclosed synthetic scenario" }, createIdempotencyKey()));
  current = await step("GET driver identity refresh", () => driver.service.restore());
  const own = await step("GET own reports (strict M1 DTO)", () => driver.api.request("listReports", { path }));
  if (!own.body.data.items.some(item => item.report_id === report.body.data.report_id) || own.body.data.items.some(item => item.participant_id !== current.participant.participant_id)) throw new Error("Own scope failed");
  const reviewer = await step("GET dispatcher current identity", () => owner.service.restore());
  const reviewed = await step("POST manual reject independent of AI/reward config", () => new NativeSessionClient(owner.api, nativeContext(reviewer)).reviewReport(report.body.data.report_id,
    { decision: "reject", reason: "Explicit native HTTP manual decision", mapped_segment_id: null, vehicle_types: [], condition: null }, createIdempotencyKey()));
  assertReceiptRewardPolicyUnchanged(report.body.data.reward, reviewed.body.data.report.reward);
  const refreshedOwn = await step("GET own reviewed report", () => driver.api.request("listReports", { path }));
  const result = refreshedOwn.body.data.items.find(item => item.report_id === report.body.data.report_id);
  if (result?.status !== "rejected" || result.review_result_id !== reviewed.body.data.report.review_result_id) throw new Error("Manual result not visible to reporter");
  return { report_status: result.status, reward_status: result.reward.status, reward_reason: result.reward.reason_code, own_scope: "PASS", manual_review: "actual server rejection receipt; no model call" };
}); } finally { await driver.vault.clear(); await owner.vault.clear(); }
