import { Hono } from "hono";
import { createApp, invoke, jsonBody, runtimeCall, send } from "../src/app";
import { createSessionObject } from "../src/session-runtime";
import { fail, errorReply } from "../src/shared/platform-error";
import type { AppEnv, RuntimeRegistry, SessionSeed } from "../src/shared/platform-types";
export const testSeed: SessionSeed = { scenario_id: "scenario_platform01", scenario_version: "1", horizon_minute: 120,
  calibration_status: "incomplete", entities: { driver: ["driver_driver01"], contributor: ["contributor_person01"] },
  values: { counter: 0, report: { pending: true, digest: "a".repeat(64) } } };
export const registry: RuntimeRegistry = {
  commands: {
    counter: { permission: "simulation:advance", operational: true,
      validate(input) { const x = input as { amount: number; fail?: boolean }; if (!x || !Number.isFinite(x.amount) || Object.keys(x).some(k => !["amount", "fail"].includes(k))) fail(422, "INVALID_SCHEMA"); return x; },
      reduce({ snapshot }, input) { const x = input as { amount: number; fail?: boolean }; if (x.fail) throw new Error("Synthetic transaction failure");
        const counter = Number(snapshot.values.counter) + x.amount;
        return { values: { ...snapshot.values, counter }, data: { counter }, events: [{ type: "state_changed", audience: ["dispatcher", "driver"] }] }; } },
    "invalid-event": { permission: "simulation:advance", operational: true, validate: x => x,
      reduce({ snapshot }) { return { values: { ...snapshot.values, counter: 999 }, data: null,
        events: [{ type: "state_changed" }, { type: "state_changed", resource_ids: ["invalid"] }] }; } },
    metadata: { permission: "reports:review", operational: false, validate: x => x,
      reduce() { return { data: { accepted: true }, events: [{ type: "proposal_changed" }] }; } },
    review: { permission: "reports:review", operational: true, validate: x => x,
      reduce({ snapshot }) { return { values: { ...snapshot.values, report: { pending: false, digest: "a".repeat(64) } }, data: { reviewed: true } }; } },
  },
  onLeaseExpired: snapshot => snapshot.values,
  views: { "counter": { permission: "operations:read", roles: ["dispatcher"], project: c => c.snapshot.values.counter } },
  imageBinding(snapshot, reportId) {
    if (reportId !== "report_report01") return null;
    const report = snapshot.values.report as { pending: boolean; digest: string };
    return { report_id: reportId, pending: report.pending, input_digest: report.digest, model: "synthetic-no-provider",
      model_config_hash: "b".repeat(64), rubric_version: "image-quality-v1" };
  },
};
const RegisteredSessionDO = createSessionObject(registry);
export class SessionDO extends RegisteredSessionDO {
  override async install(serialized: string): Promise<string> {
    const input = JSON.parse(serialized);
    // Test-only fault at the real cross-DO initialization boundary, before any target snapshot exists.
    if (input.generation > 0 && input.seed.values.test_reset_fail_once && !await this.ctx.storage.get("test_reset_fault_seen")) {
      await this.ctx.storage.put("test_reset_fault_seen", true);
      return JSON.stringify(errorReply(new Error("Synthetic initialization interruption"), input.requestId));
    }
    return super.install(serialized);
  }
}
const commands = new Hono<AppEnv>();
commands.post("/sessions/:session_id/test-commands/:name", async c => send(c, await invoke(c, runtimeCall(c, "command", {
  name: c.req.param("name"), payload: await jsonBody(c.req.raw) }))));
commands.get("/sessions/:session_id/test-counter", async c => send(c, await invoke(c, runtimeCall(c, "view", { name: "counter" }))));
const app = createApp([commands], { loadScenario: async (id, version) => {
  if (id !== testSeed.scenario_id || version !== testSeed.scenario_version) fail(404, "NOT_FOUND");
  return structuredClone(testSeed);
}, clientAddress: () => "127.0.0.1" });
export default app;
