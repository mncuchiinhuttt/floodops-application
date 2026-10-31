import type { Driver, SegmentKnowledge } from "@floodops/contracts";
import type { SimulationPolicy, SimulationRun } from "@floodops/simulation";
import type { PlanningAuthority, PolicyDecision } from "./planning-types.ts";
import { decision } from "./planning-types.ts";
import { checkProposalIdentity } from "./proposal-identity.ts";
import { createCurrentPolicy } from "./current-policy.ts";
import { capturedEntryKnowledge, roadKnowledgeGuard } from "./road-knowledge.ts";

export interface RoadEntryInput {
  driver: Pick<Driver, "driver_id" | "vehicle_type">; segmentId: string; atMinute: number;
  knowledge: Readonly<SegmentKnowledge> | null; actionIds: readonly string[];
  authority: PlanningAuthority;
}
export function evaluateRoadEntry(input: RoadEntryInput): PolicyDecision {
  const { driver, segmentId, atMinute, authority, actionIds } = input, ids = [segmentId, driver.driver_id];
  const identity = checkProposalIdentity(authority.identity, authority.current);
  if (identity.status !== "ready") return identity;
  const k = input.knowledge?.segment_id === segmentId && input.knowledge.vehicle_type === driver.vehicle_type
    ? input.knowledge : null;
  const epochs = authority.epochs.filter(item => item.segment_id === segmentId && item.vehicle_type === driver.vehicle_type);
  const validEpoch = epochs.length === 1 && Number.isSafeInteger(epochs[0]!.knowledge_epoch) && epochs[0]!.knowledge_epoch >= 0;
  const guard = roadKnowledgeGuard(k, atMinute, ids, validEpoch ? epochs[0]!.knowledge_epoch : undefined);
  if (guard) return guard;
  if (!validEpoch) return decision("blocked", "POL-03", "CONFIG_INCOMPLETE", ids);
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
  actionIdsByDriver: Readonly<Record<string, readonly string[]>>, currentPolicy: SimulationPolicy,
  allowPending = false, observe?: (result: PolicyDecision) => void): SimulationPolicy {
  const committed = createCurrentPolicy(run, currentPolicy);
  return { authorizeEntry(context) {
    const actionIds = actionIdsByDriver[context.driver.driver_id] ?? [];
    // A new plan has no authority over baseline branches or untouched committed drivers.
    if (context.branch !== "floodops" || !actionIds.length) return committed.authorizeEntry(context);
    const result = evaluateRoadEntry({ driver: context.driver, segmentId: context.segmentId, atMinute: context.atMinute,
      knowledge: capturedEntryKnowledge(run, context), actionIds, authority });
    observe?.(result);
    return { allowed: result.status === "ready" || (allowPending && result.status === "pending_approval"), reason: result.code };
  } };
}
