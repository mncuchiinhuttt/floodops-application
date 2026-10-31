import type { ComparisonRow, GateReasonPresentation, PlanPresentation } from "@floodops/design-tokens";
import { Card } from "../primitives/content";
import { StatusBadge } from "../primitives/badge";
import { RuleId } from "./context";
import { DataTable, KeyValueList } from "./data-table";
export function GateReasonList({ reasons }: { reasons: readonly GateReasonPresentation[] }) {
  return <section aria-label="Gate reasons"><h3>Gate reasons</h3>{!reasons.length ? <p>No gate reasons provided</p> : <ul>{reasons.map(reason => <li key={reason.id}>
    <RuleId id={reason.ruleId} /> <strong>{reason.label}</strong><p>{reason.detail}</p>
    <p>Evidence: {reason.evidenceIds.length ? reason.evidenceIds.join(", ") : "None provided"}</p>
  </li>)}</ul>}</section>;
}
export function PlanDiff({ changes }: { changes: readonly ComparisonRow[] }) {
  return <DataTable caption="Plan changes" rows={changes} rowKey={row => row.id} columns={[
    { key: "label", label: "Value", render: row => row.label }, { key: "committed", label: "Committed", render: row => row.committed ?? "Unavailable" },
    { key: "projected", label: "Projected", render: row => row.projected ?? "Unavailable" }
  ]} />;
}
export function PlanActionCard({ plan }: { plan: PlanPresentation }) {
  return <Card title={plan.title}><p>{plan.phase === "projected" ? "Projected" : "Committed"} · Action {plan.id}</p><StatusBadge {...plan.state} />
    <KeyValueList items={[{ label: "Target", value: plan.targetLabel }, { label: "Dependency group", value: plan.dependencyGroupLabel }, { label: "Risk", value: plan.riskLabel }]} />
    <p>Evidence references: {plan.evidenceIds.length ? plan.evidenceIds.join(", ") : "None provided"}</p>
    <GateReasonList reasons={plan.reasons} /><PlanDiff changes={plan.changes} /><p className="fo-hint">Approval is separate from Execute.</p>
  </Card>;
}
