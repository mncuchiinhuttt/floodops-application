import { useState } from "react";
import { Text } from "react-native";
import { Alert, Card, TextArea } from "@floodops/ui-native";
import type { CandidateInput, Plan, PlanDecisionInput } from "@floodops/contracts";
import { accessReason, commandReason, sameSession, type MobileContext } from "../../shared/session-context";
import { CommandButton, ScreenFrame } from "../../shared/screen-frame";
export function PlanScreen({ context, plan, currentPlan, onDecide, onExecute, pending = false }: {
  context: MobileContext; plan: Plan | null; currentPlan: { planId: string; planningJobId: string } | null; pending?: boolean;
  onDecide?: (input: PlanDecisionInput) => void; onExecute?: (input: CandidateInput) => void;
}) {
  const [reasonText, setReasonText] = useState("");
  const denied = accessReason(context, "operations:read", ["dispatcher"]);
  const stale = plan && (!sameSession(context.session, plan) || plan.input_revision !== context.session.revision ||
    !currentPlan || currentPlan.planId !== plan.plan_id || currentPlan.planningJobId !== plan.planning_job_id);
  const decideReason = commandReason(context, "planning:decide", ["dispatcher"]) ??
    (stale ? "Needs replan. The proposal revision is stale." : !plan || !["proposed", "pending_approval", "ready"].includes(plan.status)
      ? "No current proposal available for a decision." : !reasonText.trim() ? "Enter a decision reason." : !onDecide ? "Decision adapter unavailable." : null);
  const readyGroups = plan?.groups.filter(group => group.action_ids.every(id => plan.actions.some(action => action.action_id === id && action.status === "ready"))) ?? [];
  const groupsReady = readyGroups.length === plan?.groups.length && readyGroups.every(group => group.depends_on_group_ids.every(id => readyGroups.some(item => item.group_id === id)));
  const executeReason = commandReason(context, "planning:execute", ["dispatcher"]) ??
    (stale ? "Needs replan. Refresh and request a new proposal." : plan?.status !== "ready" ? "Only a current Ready plan may be sent for server Execute."
      : !plan.groups.length || !groupsReady ? "Dependency groups contain blocked, pending or missing actions." : !onExecute ? "Execute adapter unavailable." : null);
  const actionIds = plan?.actions.filter(action => ["proposed", "pending_approval", "ready"].includes(action.status)).map(action => action.action_id) ?? [];
  return <ScreenFrame title="Plan and execution" context={context}>
    {denied ? <Alert title="Plan unavailable">{denied}</Alert> : !plan ? <Text>No server proposal available.</Text> : <>
      <Text>Projected · {plan.plan_id} · {stale ? "Needs replan" : plan.status}</Text>
      <Text>Approval records a decision. Execute is a separate online command, checked atomically by the server.</Text>
      {plan.diff.map(diff => <Card key={diff.entity_id} title={diff.entity_id}>
        <Text>Projected ETA: {diff.before_eta_minute ?? "Unavailable"} → {diff.after_eta_minute ?? "Unavailable"} min</Text>
        <Text>{diff.reason}</Text><Text>Evidence: {diff.evidence_ids.join(", ") || "None"}</Text>
      </Card>)}
      {plan.actions.map(action => <Card key={action.action_id} title={`${action.kind} · ${action.status}`}>
        <Text>{action.reason}</Text><Text>Dependency group: {action.dependency_group_id}</Text>
        <Text>Evidence: {action.evidence_ids.join(", ") || "None"}</Text>
        {action.rule_results.map((rule, index) => <Text key={index}>{rule.rule_id}: {rule.outcome} · {rule.reason}</Text>)}
      </Card>)}
      {plan.groups.map(group => <Text key={group.group_id}>Group {group.group_id} · Requires {group.depends_on_group_ids.join(", ") || "No other groups"}</Text>)}
      <TextArea label="Plan decision reason" value={reasonText} onChangeText={setReasonText} maxLength={2000} />
      <CommandButton label="Approve actions" reason={decideReason ?? (!actionIds.length ? "No actions available for a decision." : null)} pending={pending}
        onPress={() => onDecide?.({ action_ids: actionIds, decision: "approve", reason: reasonText })} />
      <CommandButton label="Reject actions" reason={decideReason ?? (!actionIds.length ? "No actions available for a decision." : null)} pending={pending}
        onPress={() => onDecide?.({ action_ids: actionIds, decision: "reject", reason: reasonText })} />
      <CommandButton label="Execute plan" reason={executeReason} pending={pending}
        onPress={() => onExecute?.({ group_ids: plan.groups.map(group => group.group_id) })} />
      <Text>Committed driver assignments and ETAs remain in the authorized driver dashboard until successful Execute and refresh.</Text>
    </>}
  </ScreenFrame>;
}
