import { parseSchema } from "@floodops/contracts";
import { fail } from "../../shared/index";
import type { ReducerDefinition } from "../../shared/index";
import { currentPlan, evaluatePlan } from "../planning/plan-evaluation";
import { idle, metadataCas, runtimeRun } from "../planning/runtime-context";
import { readPlanningState, planningValues } from "../planning/runtime-state";
import { planInput } from "../planning/plan-command";
import { planningKnowledge } from "../planning/source-context";
import type { ResolvedPlanningOptions } from "../planning/runtime-types";
export function executePlan<State>(options: ResolvedPlanningOptions<State>): ReducerDefinition {
  return { permission: "planning:execute", operational: true, validate(raw) {
    const v = planInput(raw); return { ...v, request: parseSchema("CandidateInput", v.request) };
  }, reduce(context, raw) {
    const v = raw as ReturnType<typeof planInput>; metadataCas(context, v); idle(context);
    const state = readPlanningState(context.snapshot), plan = currentPlan(context, state, v.planId);
    const run = runtimeRun(context, options), input = parseSchema("CandidateInput", v.request);
    const gate = evaluatePlan(context, run, state, plan, input.group_ids);
    if (gate.status !== "ready" || !gate.projection || !gate.compiled || !gate.selection?.eligible.length) fail(422, "POLICY_BLOCKED", context.snapshot);
    const after = structuredClone(gate.projection.candidateRun), before = run.branches.floodops!.operations;
    const revision = context.snapshot.meta.revision + 1, executionId = "execution_" + crypto.randomUUID();
    const notifications = after.branches.floodops!.operations.orders.flatMap(order => {
      const old = before.orders.find(o => o.order_id === order.order_id)!;
      if (order.lifecycle !== "delivered") order.eta_minute = gate.projection!.etas[order.order_id] ?? null;
      if (old.eta_minute === order.eta_minute && old.driver_id === order.driver_id && old.pickup_hub_id === order.pickup_hub_id) return [];
      after.log.push({ sequence: after.nextSequence++, atMinute: after.nowMs / 60000, branch: "floodops",
        kind: old.driver_id !== order.driver_id ? "reassigned" : "eta_preview", driverId: order.driver_id, orderId: order.order_id,
        segmentId: null, reason: plan.plan_id, attemptId: null, scope: null, afterIncident: after.incidentSeen, category: null });
      return [parseSchema("Notification", { notification_id: "notification_" + crypto.randomUUID(), order_id: order.order_id,
        committed_revision: revision, eta_minute: order.eta_minute, message: order.eta_minute === null ? "Waiting for an authorized route."
          : `Committed ETA: ${order.eta_minute} minutes.`, is_preview_only: true, is_simulated: true })];
    });
    const committed = new Set(gate.selection.actionIds);
    state.plans[plan.plan_id] = { ...plan, status: "executed", actions: plan.actions.map(a =>
      ({ ...a, status: committed.has(a.action_id) ? "executed" : "needs_replan" })) };
    const execution = parseSchema("Execution", { execution_id: executionId, plan_id: plan.plan_id,
      before_revision: context.snapshot.meta.revision, after_revision: revision, committed_group_ids: gate.selection.eligible,
      excluded_group_ids: gate.selection.excluded, rules: [{ rule_id: "POL-08", outcome: "pass", reason: "Atomic eligible candidate committed.", entity_ids: [] }],
      sim_minute: run.nowMs / 60000, notification_ids: notifications.map(n => n.notification_id) });
    state.executions[executionId] = execution; for (const n of notifications) state.notifications[n.notification_id] = n;
    const knowledge = planningKnowledge(run).segments;
    for (const route of gate.routes) {
      state.routes[route.route_id] = route; state.committedRoutes["floodops:" + route.driver_id] = route.route_id;
      state.grants = state.grants.filter(g => g.branch !== "floodops" || g.driver_id !== route.driver_id);
      const driver = after.branches.floodops!.operations.drivers.find(d => d.driver_id === route.driver_id)!;
      for (const segmentId of new Set(route.segment_ids)) {
        const k = knowledge.find(k => k.segment_id === segmentId && k.vehicle_type === driver.vehicle_type);
        if (!k || (k.state === "known" && k.confidence_band === "high")) continue;
        state.grants.push({ execution_id: executionId, plan_id: plan.plan_id, action_ids: [...gate.compiled.actionIdsByDriver[route.driver_id]!],
          branch: "floodops", driver_id: route.driver_id, route_id: route.route_id, segment_id: segmentId,
          vehicle_type: driver.vehicle_type, knowledge_epoch: k.knowledge_epoch, evidence_ids: [...k.observation_ids],
          basis: k.state === "ordinary_unknown" ? "ordinary_unknown" : "low",
          expires_sim_minute: Math.min(run.scenario.manifest.config.horizon_minute, k.expires_sim_minute ?? run.scenario.manifest.config.horizon_minute) });
      }
    }
    return { data: execution, values: options.persistence.write(planningValues(context.snapshot, state), after),
      events: [{ type: "state_changed" }, { type: "proposal_changed", resource_ids: [plan.plan_id, executionId], audience: ["dispatcher"] }] };
  } };
}
