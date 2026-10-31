/** Actual reserve/binary upload/normalization/report M1 path; no device/model proof. */
import { createIdempotencyKey } from "@floodops/api-client";
import manifest from "../../../data/scenarios/functional-v2/manifest.json";
import { NativeSessionClient } from "../src/shared/native-client";
import { uploadReportImage } from "../src/features/reports/data/media-upload";
import { captureTime } from "../src/features/reports/capture-time";
import { nativeActor, nativeContext, runNativeProbe } from "./m1-http-probe";
const owner = nativeActor(), contributor = nativeActor();
try { await runNativeProbe("m1-native-media-report", async step => {
  const catalog = await step("GET scenarios", () => owner.api.request("listScenarios", {}));
  const scenario = catalog.body.data.items.find(item => item.scenario_id === manifest.config.scenario.scenario_id && item.version === manifest.config.scenario.version);
  if (!scenario) throw new Error("Pinned canonical-v2 scenario absent");
  const identity = await step("POST canonical-v2 native session", () => owner.service.create(scenario.scenario_id, scenario.version));
  const path = { session_id: identity.session.session_id };
  const invite = await step("POST contributor invitation", () => owner.api.request("createInvitation", { path, headers: { "Idempotency-Key": createIdempotencyKey() }, body: { role: "contributor", bound_entity_id: "contributor_functional1", expires_in_seconds: 120 } }));
  let current = await step("POST native contributor claim", () => contributor.service.claim(identity.session.session_id, invite.body.data.claim_token));
  const captured = nativeContext(current), bytes = await Bun.file(new URL("../../../data/scenarios/functional-v2/synthetic-report.png", import.meta.url)).bytes();
  const image = await step("POST reserve -> binary PUT -> POST normalized-ready completion", () => uploadReportImage(contributor.api, bytes, () => nativeContext(current), captured, createIdempotencyKey));
  current = await step("GET contributor identity refresh", () => contributor.service.restore());
  const configuration = await step("GET configuration", () => contributor.api.request("getSessionConfiguration", { path }));
  const graph = await step("GET graph", () => contributor.api.request("getSessionGraph", { path }));
  const segment = graph.body.data.segments[0]; if (!segment) throw new Error("No report segment");
  const result = await step("POST normalized citizen report (strict M1 DTO)", () => new NativeSessionClient(contributor.api, nativeContext(current)).submitReport({ kind: "citizen", media_id: image.mediaId, fixture_photo_id: null,
    segment_id: segment.segment_id, coordinate: null, captured_at: captureTime(configuration.body.data.t0, current.session.sim_minute), captured_sim_minute: current.session.sim_minute,
    vehicle_types: ["motorbike"], description: "Permitted synthetic image; actual native upload HTTP check" }, createIdempotencyKey()));
  const own = await step("GET own photo report (strict M1 DTO)", () => contributor.api.request("listReports", { path }));
  if (!own.body.data.items.some(report => report.report_id === result.body.data.report_id) || result.body.data.media_id !== image.mediaId) throw new Error("Normalized report scope mismatch");
  if (result.body.data.reward.policy === null && (result.body.data.reward.status !== "pending_config" || result.body.data.award_id !== null)) throw new Error("Missing policy incorrectly awarded");
  return { report_status: result.body.data.status, reward_status: result.body.data.reward.status, reward_reason: result.body.data.reward.reason_code, note: "actual local R2/Images normalization; no model/device proof" };
}); } finally { await contributor.vault.clear(); await owner.vault.clear(); }
