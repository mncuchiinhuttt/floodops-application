import type { CandidateInput, PlanDecisionInput } from "@floodops/contracts";
import type { BoundClient } from "../../shared/client-context";

export function createPlanningClient(client: BoundClient) {
  return {
    plan: (planId: string) => client.read("getPlan", "operations:read", "dispatcher", {
      path: { session_id: client.sessionId(), plan_id: planId },
    }),
    decide: (planId: string, body: PlanDecisionInput, key: string) => client.prepare("decidePlanActions", "planning:decide", "dispatcher", context => ({
      path: { session_id: context.identity.session.session_id, plan_id: planId }, headers: client.headers(context, key), body,
    })),
    dryRun: (planId: string, body: CandidateInput, key: string) => client.prepare("dryRunPlan", "planning:execute", "dispatcher", context => ({
      path: { session_id: context.identity.session.session_id, plan_id: planId }, headers: client.headers(context, key), body,
    })),
    execute: (planId: string, body: CandidateInput, key: string) => client.prepare("executePlan", "planning:execute", "dispatcher", context => ({
      path: { session_id: context.identity.session.session_id, plan_id: planId }, headers: client.headers(context, key), body,
    })),
  };
}
