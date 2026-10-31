import type { Plan } from "@floodops/contracts";

export function PlanActions({ plan, selected, onChange }: { plan: Plan; selected: readonly string[]; onChange: (id: string, selected: boolean) => void }) {
  return <fieldset><legend>Hành động projected</legend>{plan.actions.map(action => <article key={action.action_id}>
    <label><input type="checkbox" checked={selected.includes(action.action_id)} onChange={event => onChange(action.action_id, event.target.checked)} />
      {action.action_id} · {action.kind} · {action.status}</label>
    <p>{action.reason}</p><p>Group: {action.dependency_group_id} · Phụ thuộc: {action.depends_on_action_ids.join(", ") || "Không"}</p>
    <dl>{Object.entries(action.targets).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value ?? "Chưa có"}</dd></div>)}</dl>
    <p>Evidence: {action.evidence_ids.join(", ") || "Chưa có"}</p>
    <ul>{action.rule_results.map((rule, index) => <li key={`${rule.rule_id}-${index}`}>{rule.rule_id} · {rule.outcome} · {rule.reason} · {rule.entity_ids.join(", ")}</li>)}</ul>
  </article>)}</fieldset>;
}
export function executionReason(plan: Plan, groups: readonly string[]): string | null {
  if (!groups.length) return "Chọn dependency group để kiểm tra.";
  if (["rejected", "executed", "needs_replan"].includes(plan.status)) return `Kế hoạch không còn khả dụng: ${plan.status}.`;
  for (const id of groups) {
    const group = plan.groups.find(item => item.group_id === id);
    if (!group || group.action_ids.some(actionId => plan.actions.find(action => action.action_id === actionId)?.status !== "ready"))
      return "Group còn hành động chưa ready; approval không bỏ qua hard gate.";
    if (group.depends_on_group_ids.some(dependency => !groups.includes(dependency) &&
      !plan.groups.find(item => item.group_id === dependency)?.action_ids.every(actionId => plan.actions.find(action => action.action_id === actionId)?.status === "executed")))
      return "Cần chọn đủ dependency group chưa thực thi.";
  }
  return null;
}
