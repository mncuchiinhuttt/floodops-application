import { PlanningJobStatus } from "./planning-job-status";
import { groupClosure } from "./group-selection";
import { useState } from "react";
import { Text } from "react-native";
import { Alert, Button, Card, TextArea } from "@floodops/ui-native";
import type { CandidateInput, Plan, PlanDecisionInput, PlanningJob } from "@floodops/contracts";
import { accessReason, commandReason, sameSession, type MobileContext } from "../../shared/session-context";
import { CommandButton, ScreenFrame } from "../../shared/screen-frame";
function PlanContent({ context, plan, currentPlan, onDecide, onExecute, job = null, onReplan, pending = false }: {
  context: MobileContext; plan: Plan | null; currentPlan: { planId: string; planningJobId: string } | null; pending?: boolean;
  job?: PlanningJob | null; onReplan?: () => void;
  onDecide?: (input: PlanDecisionInput) => void; onExecute?: (input: CandidateInput) => void;
}) {
  const [reasonText, setReasonText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const denied = accessReason(context, "operations:read", ["dispatcher"]);
  const stale = plan && (!sameSession(context.session, plan) || plan.input_revision !== context.session.revision ||
    !currentPlan || currentPlan.planId !== plan.plan_id || currentPlan.planningJobId !== plan.planning_job_id ||
    Boolean(job && (!sameSession(context.session, job) || job.job_id !== plan.planning_job_id || ["failed", "cancelled", "superseded"].includes(job.status))));
  const replanReason = commandReason(context, "planning:request", ["dispatcher"]) ?? (!onReplan ? "Planning adapter unavailable."
    : job && sameSession(context.session, job) && ["queued", "running"].includes(job.status) ? "Wait for the current planning job." : null);
  const decideReason = commandReason(context, "planning:decide", ["dispatcher"]) ??
    (stale ? "Needs replan. The proposal revision is stale." : !plan || !["proposed", "pending_approval", "ready"].includes(plan.status)
      ? "No current proposal available for a decision." : !reasonText.trim() ? "Enter a decision reason." : !onDecide ? "Decision adapter unavailable." : null);
  const closure = plan ? groupClosure(plan, selected) : null;
  const executeReason = commandReason(context, "planning:execute", ["dispatcher"]) ??
    (stale ? "Needs replan. Refresh and request a new proposal." : !plan || ["executed", "rejected", "needs_replan"].includes(plan.status) ? "No current executable plan is available."
      : !selected.length || !closure?.length ? "Select an independently eligible dependency group." : !onExecute ? "Execute adapter unavailable." : null);
  const actionIds = plan?.actions.filter(action => ["proposed", "pending_approval", "ready"].includes(action.status)).map(action => action.action_id) ?? [];
  return <ScreenFrame title="Plan and execution" context={context}>
    {denied ? <Alert title="Plan unavailable">{denied}</Alert> : <>
      <CommandButton label="Request new plan" reason={replanReason} pending={pending} onPress={() => onReplan?.()} />
      <PlanningJobStatus context={context} job={job} />
      {!plan ? <Text>No server proposal available.</Text> : <>
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
      {plan.groups.map(group => {
        const eligible = groupClosure(plan, [group.group_id]) !== null;
        return <Card key={group.group_id} title={`Group ${group.group_id}`}>
          <Text>Requires: {group.depends_on_group_ids.join(", ") || "No other groups"}</Text>
          <Button label={`Select group ${group.group_id}`} accessibilityState={{ selected: selected.includes(group.group_id) }}
            {...(!eligible || pending ? { disabled: true, disabledReason: pending ? "Wait for the current command." : "This closure contains unavailable or blocked actions." } : { disabled: false })}
            onPress={() => setSelected(current => current.includes(group.group_id) ? current.filter(id => id !== group.group_id) : [...current, group.group_id])} />
        </Card>;
      })}
      <Text>Selected closure: {closure?.join(", ") || "None"}</Text>
      <TextArea label="Plan decision reason" value={reasonText} onChangeText={setReasonText} maxLength={2000} />
      <CommandButton label="Approve actions" reason={decideReason ?? (!actionIds.length ? "No actions available for a decision." : null)} pending={pending}
        onPress={() => onDecide?.({ action_ids: actionIds, decision: "approve", reason: reasonText })} />
      <CommandButton label="Reject actions" reason={decideReason ?? (!actionIds.length ? "No actions available for a decision." : null)} pending={pending}
        onPress={() => onDecide?.({ action_ids: actionIds, decision: "reject", reason: reasonText })} />
      <CommandButton label="Execute plan" reason={executeReason} pending={pending}
        onPress={() => onExecute?.({ group_ids: closure ?? [] })} />
      <Text>Committed driver assignments and ETAs remain in the authorized driver dashboard until successful Execute and refresh.</Text>
    </>}</>}
  </ScreenFrame>;
}

type PlanScreenProps = Parameters<typeof PlanContent>[0];
export function PlanScreen(props: PlanScreenProps) {
  const plan = props.plan;
  return <PlanContent key={`${props.context.participant.participant_id}:${props.context.session.session_id}:${props.context.session.generation}:${plan?.plan_id}:${plan?.planning_job_id}:${plan?.input_revision}`} {...props} />;
}
