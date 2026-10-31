import type { Approval, Plan, RuleId, SegmentKnowledge } from "@floodops/contracts";

export type PlanningIdentity = Pick<Plan, "session_id" | "generation" | "input_revision" | "plan_id" | "planning_job_id">;
export interface CurrentPlanningIdentity {
  session_id: string; generation: number; revision: number;
  latest_plan_id: string | null; latest_requested_job_id: string | null;
}
export type Readiness = "ready" | "pending_approval" | "blocked" | "needs_replan";
export interface PolicyDecision {
  status: Readiness; rule_id: RuleId; code: string; entity_ids: string[]; uncertain: boolean;
}
export type KnowledgeEpoch = Pick<SegmentKnowledge, "segment_id" | "vehicle_type" | "knowledge_epoch">;
/** All fields come from the server-owned captured snapshot, never model assertions. */
export interface PlanningAuthority {
  identity: PlanningIdentity; current: CurrentPlanningIdentity;
  approvals: readonly Approval[]; epochs: readonly KnowledgeEpoch[];
}
export function decision(status: Readiness, rule: RuleId, code: string,
  ids: readonly string[] = [], uncertain = false): PolicyDecision {
  return { status, rule_id: rule, code, entity_ids: [...ids], uncertain };
}
