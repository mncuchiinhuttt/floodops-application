import { useId, useState } from "react";
import type { CandidateInput, Plan, PlanDecisionInput } from "@floodops/contracts";
import { Alert, Button, Card, DataTable, TextArea } from "@floodops/ui-web";
import { accessReason, type AccessContext } from "../../shared/access";
import { Denied, etaLabel, ResourceView, SimulationBanner, type Resource } from "../../shared/feature-state";
import { useCommand } from "../../shared/use-command";
import { executionReason, PlanActions } from "./plan-actions";

export interface PlanScreenProps {
  context: AccessContext; resource: Resource<Plan>;
  onDecision: (input: PlanDecisionInput) => Promise<unknown>;
  onDryRun: (input: CandidateInput) => Promise<unknown>;
  onExecute: (input: CandidateInput) => Promise<unknown>;
}
export function PlanScreen(props: PlanScreenProps) {
  const denied = accessReason(props.context, "operations:read", "dispatcher");
  if (denied) return <Denied reason={denied} />;
  return <ResourceView resource={props.resource}>{plan => <PlanDetail key={`${props.context.identity.participant.participant_id}:${plan.session_id}:${plan.generation}:${plan.plan_id}:${plan.input_revision}`} {...props} plan={plan} />}</ResourceView>;
}
function PlanDetail({ context, plan, onDecision, onExecute, onDryRun }: PlanScreenProps & { plan: Plan }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const reasonId = useId();
  const session = context.identity.session;
  const command = useCommand(`${session.session_id}:${session.generation}:${plan.plan_id}:${session.revision}`);
  if (plan.session_id !== session.session_id || plan.generation !== session.generation) return <Denied reason="Kế hoạch thuộc phiên khác. Cần ghép nối lại." />;
  const stale = plan.input_revision !== session.revision || plan.status === "needs_replan";
  const staleReason = stale ? "Needs replan — kế hoạch cũ. Làm mới trước khi quyết định." : null;
  const decisionReason = staleReason ?? accessReason(context, "planning:decide", "dispatcher", true) ??
    (!selected.length ? "Chọn hành động để quyết định." : !reason.trim() ? "Nhập lý do quyết định." : null);
  const approveReason = decisionReason ?? (plan.actions.some(action => selected.includes(action.action_id) &&
    ["blocked", "rejected", "executed", "needs_replan"].includes(action.status)) ? "Hành động bị chặn hoặc đã quyết định; approval không bỏ qua hard gate." : null);
  const candidateReason = staleReason ?? accessReason(context, "planning:execute", "dispatcher", true) ?? (!groups.length ? "Chọn group để kiểm tra." : null);
  const executeReason = candidateReason ?? executionReason(plan, groups);
  const disabled = (value: string | null) => value ? { disabled: true as const, disabledReason: value } : { disabled: false as const };
  return <main><SimulationBanner session={session} provenance={context.provenance} /><h1>Kế hoạch {plan.plan_id}</h1>
    <Alert title="Projected">{plan.status} · Revision đầu vào {plan.input_revision}. Approve/Reject chỉ ghi quyết định. Execute riêng mới có thể commit.</Alert>
    {staleReason && <Alert title="Needs replan">{staleReason}</Alert>}
    <PlanActions plan={plan} selected={selected} onChange={(id, checked) => setSelected(values => checked ? [...values, id] : values.filter(value => value !== id))} />
    <TextArea id={reasonId} label="Lý do quyết định" value={reason} maxLength={2000} onChange={event => setReason(event.target.value)} />
    <div className="feature-actions"><Button {...disabled(approveReason)} pending={command.pending} onClick={() => void command.run(() => onDecision({ action_ids: selected, decision: "approve", reason }))}>Approve</Button>
      <Button {...disabled(decisionReason)} variant="danger" pending={command.pending} onClick={() => void command.run(() => onDecision({ action_ids: selected, decision: "reject", reason }))}>Reject</Button></div>
    <Card title="Dependency groups"><fieldset><legend>Candidate cho dry-run / Execute</legend>{plan.groups.map(group => <label key={group.group_id}>
      <input type="checkbox" checked={groups.includes(group.group_id)} onChange={event => setGroups(values => event.target.checked ? [...values, group.group_id] : values.filter(id => id !== group.group_id))} />
      {group.group_id} · {group.action_ids.join(", ")} · Phụ thuộc: {group.depends_on_group_ids.join(", ") || "Không"}
    </label>)}</fieldset>
      <div className="feature-actions"><Button {...disabled(candidateReason)} pending={command.pending} onClick={() => void command.run(() => onDryRun({ group_ids: groups }))}>Dry-run</Button>
        <Button {...disabled(executeReason)} pending={command.pending} onClick={() => void command.run(() => onExecute({ group_ids: groups }))}>Execute</Button></div>
      <p>Server kiểm lại evidence, revision, capacity và dependencies; không optimistic commit.</p>
    </Card>
    <DataTable caption="Projected diff" rows={plan.diff} rowKey={entry => entry.entity_id} emptyLabel="Không có thay đổi." columns={[
      { key: "entity", label: "Đối tượng", render: entry => entry.entity_id },
      { key: "before", label: "ETA trước", render: entry => etaLabel(entry.before_eta_minute) },
      { key: "after", label: "ETA projected", render: entry => etaLabel(entry.after_eta_minute) },
      { key: "reason", label: "Lý do / evidence", render: entry => `${entry.reason} · ${entry.evidence_ids.join(", ")}` },
    ]} />{command.message && <Alert title="Kết quả lệnh">{command.message}</Alert>}
  </main>;
}
