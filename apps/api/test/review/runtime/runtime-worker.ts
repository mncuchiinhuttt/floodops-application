import { Hono } from "hono";
import { createApp } from "../../../src/app/index";
import { createSourcesFeature } from "../../../src/features/sources/index";
import type { Initialization } from "../../../src/session-runtime/index";
import { fail, invoke, jsonBody, runtimeCall, send } from "../../../src/shared/index";
import type { AppEnv, RuntimeRegistry } from "../../../src/shared/index";
import { createSourceBackedReviewRuntime, reconcileReviewGaps } from "../../../src/features/reports/review/index";
import { advanceFixture, imageConfig, loadReviewScenario, prepareInstallation, sourcePort, ports } from "./source-fixture";

import { testRewardConfig } from "../../rewards/fixtures";
const sources = createSourcesFeature(ports);
const review = createSourceBackedReviewRuntime(ports, { resolveRewardPolicy: receipt =>
  receipt.policy_id === testRewardConfig.policy.policy_id && receipt.version === testRewardConfig.policy.version
    && receipt.config_hash === testRewardConfig.policy.config_hash ? testRewardConfig : null, imageConfig });
const registry: RuntimeRegistry = { ...review.registry, commands: { ...sources.registry.commands, ...review.registry.commands,
  "test:clock": { permission: "simulation:advance", operational: true, validate(value) {
    const input = value as { to_minute: number };
    if (!input || Object.keys(input).some(key => key !== "to_minute") || !Number.isFinite(input.to_minute) || input.to_minute < 0) fail(422, "INVALID_SCHEMA");
    return input;
  }, reduce(context, input) {
    const minute = (input as { to_minute: number }).to_minute, advanced = advanceFixture(context, minute);
    const after = { ...context, snapshot: { ...context.snapshot, values: advanced.values,
      meta: { ...context.snapshot.meta, sim_minute: minute } } };
    const state = sourcePort.read(after);
    const store = reconcileReviewGaps(after, { scope: state.relevantScope, knowledge: state.knowledge,
      observations: state.evidence.observations, sources: state.evidence.sources, now_sim_minute: minute });
    return { ...advanced, values: { ...advanced.values, reviewRewards: store }, events: [{ type: "state_changed" as const }] };
  } },
} , views: { ...sources.registry.views, ...review.registry.views } };
const RegisteredSessionDO = sources.createSessionObject(registry);
export class SessionDO extends RegisteredSessionDO {
  override async install(serialized: string): Promise<string> {
    const initialized = await prepareInstallation(JSON.parse(serialized) as Initialization, testRewardConfig.policy, this.env);
    return super.install(JSON.stringify(initialized));
  }
}
const tests = new Hono<AppEnv>();
tests.post("/sessions/:session_id/test-clock", async c => send(c, await invoke(c, runtimeCall(c, "command", {
  name: "test:clock", payload: await jsonBody(c.req.raw) }))));
export default createApp([...sources.routers, review.router, tests], { loadScenario: loadReviewScenario, clientAddress: () => "127.0.0.1" });
