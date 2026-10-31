import { deriveCurrentKnowledge } from "@floodops/domain/knowledge";
import { createCurrentPolicy } from "@floodops/domain/planning";
import { canonicalJson } from "@floodops/simulation";
import type { SimulationPolicy, SimulationRun } from "@floodops/simulation";
import type { TransitionContext } from "../../shared/index";
import { fail } from "../../shared/index";
import { readPlanningState } from "./runtime-state";
import { planningKnowledge, sourceContext } from "./source-context";

/** Server-owned advance callback. Proposal/latest-plan pointers never grant current movement. */
export function createCommittedMovementPolicy(context: TransitionContext, run: Readonly<SimulationRun>): SimulationPolicy {
  const meta = context.snapshot.meta, config = run.scenario.manifest.config;
  const checkpoint = context.snapshot.values.simulation as { reference?: { bundle_hash?: string } } | undefined;
  if (meta.scenario_id !== config.scenario.scenario_id || meta.scenario_version !== config.scenario.version
    || meta.horizon_minute !== config.horizon_minute || meta.sim_minute !== run.nowMs / 60000
    || checkpoint?.reference?.bundle_hash !== run.scenario.bundleHash) fail(503, "CONFIG_INCOMPLETE");
  try { planningKnowledge(run); } catch { fail(503, "CONFIG_INCOMPLETE"); }
  const state = readPlanningState(context.snapshot);
  return createCurrentPolicy(run, { authorizeEntry(entry) {
    const pair = run.knowledge.find(k => k.segment_id === entry.segmentId && k.vehicle_type === entry.driver.vehicle_type);
    if (!pair) return { allowed: false, reason: "CONFIG_INCOMPLETE" };
    const knowledge = deriveCurrentKnowledge(pair, sourceContext(run, entry.atMinute));
    if (knowledge.state === "authoritative_closed" || knowledge.condition === "impassable") return { allowed: false, reason: "POL-01" };
    if (knowledge.state === "unresolved_conflict") return { allowed: false, reason: "POL-03:CONFLICT" };
    if (knowledge.state === "known" && knowledge.condition !== "unknown" && knowledge.confidence_band === "high") {
      return { allowed: true, reason: "POL-08" };
    }
    const routeId = state.committedRoutes[`${entry.branch}:${entry.driver.driver_id}`], route = routeId ? state.routes[routeId] : undefined;
    const runtime = run.branches[entry.branch]?.runtime[entry.driver.driver_id];
    if (!route || route.driver_id !== entry.driver.driver_id || !runtime
      || canonicalJson(route.segment_ids) !== canonicalJson(runtime.segments)
      || !route.segment_ids.includes(entry.segmentId)) return { allowed: false, reason: "POL-02" };
    const grant = state.grants.find(g => g.branch === entry.branch && g.driver_id === entry.driver.driver_id
      && g.route_id === routeId && g.segment_id === entry.segmentId && g.vehicle_type === entry.driver.vehicle_type
      && g.knowledge_epoch === knowledge.knowledge_epoch && entry.atMinute < g.expires_sim_minute
      && g.expires_sim_minute <= run.scenario.manifest.config.horizon_minute
      && (g.basis === "ordinary_unknown" ? knowledge.state === "ordinary_unknown"
        : knowledge.state === "known" && knowledge.confidence_band === "low"
          && canonicalJson([...g.evidence_ids].sort()) === canonicalJson([...knowledge.observation_ids].sort())));
    if (!grant) return { allowed: false, reason: "POL-02" };
    const execution = state.executions[grant.execution_id], plan = state.plans[grant.plan_id];
    const valid = execution?.plan_id === grant.plan_id && plan && grant.action_ids.every(id => plan.actions.some(a =>
      a.action_id === id && a.status === "executed" && execution.committed_group_ids.includes(a.dependency_group_id)));
    return { allowed: !!valid, reason: valid ? "COMMITTED_APPROVED_RISK" : "POL-02" };
  } });
}
