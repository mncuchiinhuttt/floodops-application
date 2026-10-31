import { parseSchema } from "@floodops/contracts";
import type { RewardPolicyRef } from "@floodops/contracts";
import { createApp } from "../../src/app/index";
import { fail } from "../../src/shared/index";
import type { RuntimeRegistry } from "../../src/shared/index";
import { scenarioCatalog, simulationPersistence, loadSessionScenario } from "../../src/index";
import { createSourcesFeature } from "../../src/features/sources/index";
import { createSourceReviewPort } from "../../src/features/reports/index";
import type { SourcesPorts } from "../../src/features/scenario/index";
// Test-only mutable server configuration. Reports are always created through genuine Source HTTP.
// This is deliberately not a production configuration store or a default reward amount.
const configured = new Map<string, RewardPolicyRef | null>();
export const ports: SourcesPorts = { scenarioCatalog, simulationPersistence, receiptRewardPolicy(context) {
  return configured.get(`${context.sessionId}:${context.generation}`) ?? null;
} };
export const sourceReview = createSourceReviewPort(ports);
const sources = createSourcesFeature(ports);
const registry: RuntimeRegistry = { ...sources.registry, commands: { ...sources.registry.commands,
  "test-receipt-policy": { permission: "reports:review", operational: false, validate(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).some(key => key !== "policy")) fail(422, "INVALID_SCHEMA");
    const value = raw as { policy?: unknown };
    return { policy: value.policy === null ? null : parseSchema("RewardPolicyRef", value.policy) };
  }, reduce({ snapshot }, raw) {
    const value = raw as { policy: RewardPolicyRef | null }, key = `${snapshot.meta.session_id}:${snapshot.meta.generation}`;
    const previous = configured.get(key);
    // Preserve a provider object's identity while changing its contents: receipt cloning is observable.
    if (previous && value.policy) Object.assign(previous, value.policy);
    else configured.set(key, value.policy);
    return { data: structuredClone(value.policy), values: { ...snapshot.values, testReceiptPolicy: structuredClone(value.policy) }, events: [] };
  } }
} };
const Base = sources.createSessionObject(registry);
export class SessionDO extends Base {}
export default createApp(sources.routers, { loadScenario: loadSessionScenario });
