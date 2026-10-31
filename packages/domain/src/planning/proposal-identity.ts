import type { CurrentPlanningIdentity, PlanningIdentity, PolicyDecision } from "./planning-types.ts";
import { decision } from "./planning-types.ts";

/** Pure predicate only: the eventual transaction must recheck these trusted pointers. */
export function checkProposalIdentity(plan: PlanningIdentity, current: CurrentPlanningIdentity): PolicyDecision {
  const numbers = [plan.generation, plan.input_revision, current.generation, current.revision];
  if (numbers.some(value => !Number.isSafeInteger(value) || value < 0)
    || !plan.session_id || !plan.plan_id || !plan.planning_job_id) {
    return decision("blocked", "POL-03", "INVALID_IDENTITY");
  }
  if (plan.session_id !== current.session_id || plan.generation !== current.generation
    || plan.input_revision !== current.revision || plan.plan_id !== current.latest_plan_id
    || plan.planning_job_id !== current.latest_requested_job_id) {
    return decision("needs_replan", "POL-03", "STALE_PROPOSAL", [plan.plan_id]);
  }
  return decision("ready", "POL-08", "CURRENT_PROPOSAL", [plan.plan_id]);
}
