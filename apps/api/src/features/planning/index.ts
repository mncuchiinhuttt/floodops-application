import { createHash } from "node:crypto";
import { PLANNER_VERSION, searchLimits } from "./deterministic-types";
import { CONTRACT_VERSION, parseSchema } from "@floodops/contracts";
import type { RuntimeRegistry } from "../../shared/index";
import { drivePlanning } from "./drive-planning";
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
  const deadlineMs = options.deadlineMs ?? 30000, maxTurns = options.maxTurns ?? 6, maxToolCalls = options.maxToolCalls ?? 12;
  if (!Number.isSafeInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > 60000 || !Number.isSafeInteger(maxTurns)
    || maxTurns < 1 || maxTurns > 12 || !Number.isSafeInteger(maxToolCalls) || maxToolCalls < 1 || maxToolCalls > 64) throw new Error("Invalid planning resource budget.");
  const limits = searchLimits(options.search);
  const planner = Object.freeze(parseSchema("DeterministicPlannerMetadata", { kind: "deterministic",
    algorithm_version: PLANNER_VERSION, search_limit: limits.maxCandidates,
    config_hash: createHash("sha256").update(JSON.stringify({
      algorithm: PLANNER_VERSION, limits, deadlineMs, contract: CONTRACT_VERSION })).digest("hex") }));
  const resolved: ResolvedPlanningOptions<State> = { ...options, planner, limits, model: PLANNER_VERSION, deadlineMs, maxTurns, maxToolCalls,
    modelConfigHash: createHash("sha256").update(JSON.stringify({
      algorithm: PLANNER_VERSION, limits, deadlineMs, contract: CONTRACT_VERSION })).digest("hex"),
    material: options.material ?? (() => ({ jobId: "job_" + crypto.randomUUID(), leaseId: "lease_" + crypto.randomUUID(),
      planId: "plan_" + crypto.randomUUID(), nonce: Array.from(crypto.getRandomValues(new Uint8Array(32)), v => v.toString(16).padStart(2, "0")).join("") })) };
  const registry: RuntimeRegistry = { commands: {
    [PLAN_START]: startPlanning(resolved), [PLAN_BEGIN]: beginPlanning(), [PLAN_COMPLETE]: completePlanning(resolved),
    [PLAN_CANCEL]: cancelPlanning(), [PLAN_DECIDE]: decideActions(resolved), [PLAN_DRY_RUN]: dryRunCommand(resolved),
    [PLAN_EXECUTE]: executePlan(resolved), [INCIDENT_TRIGGER]: triggerIncident(resolved) },
    views: planningViews(resolved), drivers: { planning: (dispatch, call, reply) => drivePlanning(dispatch, call, reply, resolved) },
    onLeaseExpired: expirePlanning };
  return { registry, planner, router: createPlanningRouter(), committedPolicy: createCommittedMovementPolicy };
}
export { createCommittedMovementPolicy } from "./committed-policy";
export type { CommittedMovementGrant, PlanningRuntimeOptions } from "./runtime-types";
export { PLAN_START, PLAN_CANCEL, PLAN_BEGIN, PLAN_COMPLETE, PLAN_DECIDE, PLAN_DRY_RUN, PLAN_EXECUTE, PLANNING_VIEW } from "./runtime-types";
export { drivePlanning } from "./drive-planning";
export type { PlanningReservation, PlanningDispatch } from "./drive-planning";
export { createPlanningServices } from "./internal-services";
export { runDeterministicPlanner } from "./deterministic-planner";
export { DEFAULT_SEARCH_LIMITS, PLANNER_VERSION, PlanningSearchStopped, searchLimits } from "./deterministic-types";
export type { SearchLimits, SearchEvidence, DeterministicProposal } from "./deterministic-types";
export { runtimeRun, idle as assertPlanningIdle } from "./runtime-context";
