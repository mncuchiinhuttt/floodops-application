import { Hono } from "hono";
import { advanceRun } from "@floodops/simulation";
import { createApp } from "../../src/app/index";
import { fail, invoke, jsonBody, runtimeCall, send } from "../../src/shared/index";
import type { AppEnv, RuntimeRegistry } from "../../src/shared/index";
import { scenarioCatalog, simulationPersistence, loadSessionScenario } from "../../src/index";
import { createSourcesFeature } from "../../src/features/sources/index";
import { createSourceReviewPort, createSourceImagePreparationRegistry } from "../../src/features/reports/index";
import { createReviewRuntime, createReviewSeed, reconcileReviewGaps, prepareImageReviewBinding,
  imageContextKey, REVIEW_ACCEPT } from "../../src/features/reports/review/index";

export const ports = { scenarioCatalog, simulationPersistence };
export const sourceReview = createSourceReviewPort(ports);
export const imageConfig = { model: "synthetic-no-provider", model_config_hash: "b".repeat(64), prompt_version: "source-adapter-test-v1" };
export const imageOptions = { prepare: prepareImageReviewBinding, contextKey: imageContextKey, config: imageConfig };
// Explicit existing-contract test policy. This is not evidence for a v0.5 receipt-policy cutover.
export const reviewRuntime = createReviewRuntime({ source: sourceReview,
  rewards: { points_per_report: 7, eligible_source_ids: ["src_citizen1"] }, imageConfig });
const sources = createSourcesFeature(ports), preparation = createSourceImagePreparationRegistry(ports, imageOptions);
const accept = reviewRuntime.registry.commands![REVIEW_ACCEPT]!;
const registry: RuntimeRegistry = { ...reviewRuntime.registry, commands: {
  ...sources.registry.commands, ...reviewRuntime.registry.commands, ...preparation.commands,
  "test-review-rollback": { ...accept, reduce(context, input) {
    const transition = accept.reduce(context, input);
    return { ...transition, events: [...(transition.events ?? []), { type: "state_changed", resource_ids: ["invalid"] }] };
  } },
  "test-review-clock": { permission: "simulation:advance", operational: true, validate(raw) {
    const value = raw as { to_minute: number };
    if (!value || Object.keys(value).some(key => key !== "to_minute") || !Number.isFinite(value.to_minute)) fail(422, "INVALID_SCHEMA");
    return value;
  }, reduce(context, raw) {
    const minute = (raw as { to_minute: number }).to_minute;
    const advanced = advanceRun(simulationPersistence.read(context.snapshot.values), minute,
      { authorizeEntry: () => ({ allowed: false, reason: "TEST_NO_ROUTE_AUTHORITY" }) });
    if (!advanced.complete) throw new Error("Test advance did not finish");
    const values = simulationPersistence.write(context.snapshot.values, advanced.run);
    const after = { ...context, snapshot: { ...context.snapshot, values, meta: { ...context.snapshot.meta, sim_minute: minute } } };
    const state = sourceReview.read(after);
    const store = reconcileReviewGaps(after, { scope: state.relevantScope, knowledge: state.knowledge,
      observations: state.evidence.observations, sources: state.evidence.sources, now_sim_minute: minute });
    return { values: { ...values, reviewRewards: store }, simMinute: minute, data: { sim_minute: minute }, events: [{ type: "state_changed" }] };
  } }
}, views: { ...sources.registry.views, ...reviewRuntime.registry.views, ...preparation.views } };
const Base = sources.createSessionObject(registry);
export class SessionDO extends Base {}
const tests = new Hono<AppEnv>();
tests.post("/sessions/:session_id/test-review-clock", async c => send(c, await invoke(c, runtimeCall(c, "command", {
  name: "test-review-clock", payload: await jsonBody(c.req.raw) }))));
export default createApp([...sources.routers, reviewRuntime.router, tests], { async loadScenario(id, version) {
  const seed = await loadSessionScenario(id, version), run = simulationPersistence.read(seed.values);
  const scope = run.scenario.manifest.config.relevant_scope_pairs.map(pair => ({ ...pair,
    knowledge_epoch: run.knowledge.find(item => item.segment_id === pair.segment_id && item.vehicle_type === pair.vehicle_type)!.knowledge_epoch }));
  return { ...seed, values: { ...seed.values, adapterSentinel: { preserve: true }, reviewRewardsSeed: createReviewSeed({ scope,
    knowledge: run.knowledge, observations: run.sourceSnapshot.observations, sources: run.sourceSnapshot.sources, now_sim_minute: 0 }) } };
} });
