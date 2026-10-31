import { createHash } from "node:crypto";
import { CONTRACT_VERSION } from "@floodops/contracts";
import type { RuntimeRegistry } from "../../shared/index";
import { createPlanningRouter } from "./router";
import { planningViews } from "./views";
import { startPlanning } from "./start-job";
import { beginPlanning, completePlanning, cancelPlanning } from "./job-transitions";
import { decideActions, dryRunCommand } from "./decisions";
import { executePlan } from "../operations/execute";
import { triggerIncident, INCIDENT_TRIGGER } from "../incidents/runtime";
import { expirePlanning } from "./job-leases";
import { createCommittedMovementPolicy } from "./committed-policy";
import { PLAN_START, PLAN_CANCEL, PLAN_BEGIN, PLAN_COMPLETE, PLAN_DECIDE, PLAN_DRY_RUN, PLAN_EXECUTE } from "./runtime-types";
import type { PlanningRuntimeOptions, ResolvedPlanningOptions } from "./runtime-types";
export function createPlanningRuntime<State>(options: PlanningRuntimeOptions<State>) {
  const deadlineMs = options.deadlineMs ?? 20000, maxTurns = options.maxTurns ?? 6, maxToolCalls = options.maxToolCalls ?? 12;
  if (!Number.isSafeInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > 60000 || !Number.isSafeInteger(maxTurns)
    || maxTurns < 1 || maxTurns > 12 || !Number.isSafeInteger(maxToolCalls) || maxToolCalls < 1 || maxToolCalls > 64) throw new Error("Invalid planning resource budget.");
  const resolved: ResolvedPlanningOptions<State> = { ...options, model: options.model ?? "", deadlineMs, maxTurns, maxToolCalls,
    modelConfigHash: options.modelConfigHash ?? createHash("sha256").update(JSON.stringify({
      model: options.model ?? null, deadlineMs, maxTurns, maxToolCalls, contract: CONTRACT_VERSION })).digest("hex"),
    material: options.material ?? (() => ({ jobId: "job_" + crypto.randomUUID(), leaseId: "lease_" + crypto.randomUUID(),
      planId: "plan_" + crypto.randomUUID(), nonce: Array.from(crypto.getRandomValues(new Uint8Array(32)), v => v.toString(16).padStart(2, "0")).join("") })) };
  const registry: RuntimeRegistry = { commands: {
    [PLAN_START]: startPlanning(resolved), [PLAN_BEGIN]: beginPlanning(), [PLAN_COMPLETE]: completePlanning(resolved),
    [PLAN_CANCEL]: cancelPlanning(), [PLAN_DECIDE]: decideActions(resolved), [PLAN_DRY_RUN]: dryRunCommand(resolved),
    [PLAN_EXECUTE]: executePlan(resolved), [INCIDENT_TRIGGER]: triggerIncident(resolved) },
    views: planningViews(resolved), onLeaseExpired: expirePlanning };
  return { registry, router: createPlanningRouter(resolved), committedPolicy: createCommittedMovementPolicy };
}
export { createCommittedMovementPolicy } from "./committed-policy";
export { createResponsesProvider } from "../../integrations/openai/index";
export type { CommittedMovementGrant, PlanningRuntimeOptions, CommanderProvider, CommanderRequest } from "./runtime-types";
export { PLAN_START, PLAN_CANCEL, PLAN_BEGIN, PLAN_COMPLETE, PLAN_DECIDE, PLAN_DRY_RUN, PLAN_EXECUTE, PLANNING_VIEW } from "./runtime-types";
export { drivePlanning } from "./drive-planning";
export type { PlanningReservation, PlanningDispatch } from "./drive-planning";
