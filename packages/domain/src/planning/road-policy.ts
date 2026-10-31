import type { Driver, SegmentKnowledge } from "@floodops/contracts";
import type { SimulationPolicy, SimulationRun } from "@floodops/simulation";
import type { PlanningAuthority, PolicyDecision } from "./planning-types.ts";
import { decision } from "./planning-types.ts";
import { checkProposalIdentity } from "./proposal-identity.ts";

export interface RoadEntryInput {
  driver: Pick<Driver, "driver_id" | "vehicle_type">; segmentId: string; atMinute: number;
  knowledge: Readonly<SegmentKnowledge> | null; actionIds: readonly string[];
  authority: PlanningAuthority;
}
export function evaluateRoadEntry(input: RoadEntryInput): PolicyDecision {
  const { driver, segmentId, atMinute, authority, actionIds } = input, ids = [segmentId, driver.driver_id];
  const identity = checkProposalIdentity(authority.identity, authority.current);
  if (identity.status !== "ready") return identity;
  if (!Number.isFinite(atMinute) || atMinute < 0) return decision("blocked", "POL-03", "INVALID_CLOCK", ids);
  const k = input.knowledge?.segment_id === segmentId && input.knowledge.vehicle_type === driver.vehicle_type
    ? input.knowledge : null;
  if (k?.state === "authoritative_closed") return decision("blocked", "POL-01", "AUTHORITATIVE_CLOSED", ids);
  if (k?.state === "unresolved_conflict") return decision("blocked", "POL-03", "UNRESOLVED_CONFLICT", ids);
  const epochs = authority.epochs.filter(item => item.segment_id === segmentId && item.vehicle_type === driver.vehicle_type);
  if (epochs.length !== 1 || !Number.isSafeInteger(epochs[0]!.knowledge_epoch) || epochs[0]!.knowledge_epoch < 0) {
    return decision("blocked", "POL-03", "CONFIG_INCOMPLETE", ids);
  }
  if (k && k.knowledge_epoch !== epochs[0]!.knowledge_epoch) return decision("needs_replan", "POL-03", "STALE_EPOCH", ids);
  if (k && ((k.expires_sim_minute !== null && atMinute >= k.expires_sim_minute)
    || (k.state === "known" && k.expires_sim_minute === null))) {
    return decision("needs_replan", "POL-03", "EVIDENCE_EXPIRED", ids);
  }
  if (k?.condition === "impassable") return decision("blocked", "POL-01", "EFFECTIVE_IMPASSABLE", ids);
  const approvals = authority.approvals.filter(item => item.plan_id === authority.identity.plan_id
    && item.input_revision === authority.identity.input_revision && actionIds.includes(item.action_id));
  if (approvals.some(item => item.decision === "reject")) return decision("blocked", "POL-02", "ACTION_REJECTED", actionIds);
  if (k?.state === "known" && k.condition !== "unknown" && k.confidence_band === "high") {
    return decision("ready", "POL-08", "FRESH_HIGH_EVIDENCE", ids);
  }
  if (!actionIds.length || actionIds.some(id => !approvals.some(item => item.action_id === id && item.decision === "approve"))) {
    return decision("pending_approval", "POL-02", "EXACT_APPROVAL_REQUIRED", actionIds, true);
  }
  return decision("ready", "POL-02", "SOFT_RISK_APPROVED", actionIds, true);
}

/** Closed/conflict/expired roads never become authorized by a permissive proposal policy. */
export function createPlanningPolicy(run: SimulationRun, authority: PlanningAuthority,
  actionIdsByDriver: Readonly<Record<string, readonly string[]>>, allowPending = false,
  observe?: (result: PolicyDecision) => void): SimulationPolicy {
  return { authorizeEntry(context) {
    const captured = run.knowledge.find(k => k.segment_id === context.segmentId && k.vehicle_type === context.driver.vehicle_type);
    // Simulator deliberately erases expired evidence. Preserve its captured freshness/conflict guard.
    const erased = captured && context.knowledge?.state === "ordinary_unknown"
      && captured.knowledge_epoch === context.knowledge.knowledge_epoch
      && (captured.state === "unresolved_conflict" || (captured.expires_sim_minute !== null
        && context.atMinute >= captured.expires_sim_minute));
    const result = evaluateRoadEntry({ driver: context.driver, segmentId: context.segmentId, atMinute: context.atMinute,
      knowledge: erased ? captured : context.knowledge,
      actionIds: actionIdsByDriver[context.driver.driver_id] ?? [], authority });
    observe?.(result);
    return { allowed: result.status === "ready" || (allowPending && result.status === "pending_approval"), reason: result.code };
  } };
}
