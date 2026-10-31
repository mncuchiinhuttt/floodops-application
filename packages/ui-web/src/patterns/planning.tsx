import type { ComparisonRow, GateReasonPresentation, PlanPresentation } from "@floodops/design-tokens";
import { Card } from "../primitives/content";
import { StatusBadge } from "../primitives/badge";
import { RuleId } from "./context";
import { DataTable, KeyValueList } from "./data-table";

export function GateReasonList({ reasons }: { reasons: readonly GateReasonPresentation[] }) {
  return <section aria-label="Gate reasons" className="grid gap-2"><h3 className="m-0 text-sm font-semibold">Gate reasons</h3>
    {!reasons.length ? <p className="m-0 text-muted-foreground">No gate reasons provided</p> : <ul className="m-0 grid list-none gap-2 p-0">{reasons.map(reason => <li key={reason.id} className="grid gap-1 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2"><RuleId id={reason.ruleId} /> <strong className="font-medium">{reason.label}</strong></div>
      <p className="m-0 text-muted-foreground">{reason.detail}</p>
      <p className="m-0 text-xs text-muted-foreground tabular-nums">Evidence: {reason.evidenceIds.length ? reason.evidenceIds.join(", ") : "None provided"}</p>
    </li>)}</ul>}</section>;
}
export function PlanDiff({ changes }: { changes: readonly ComparisonRow[] }) {
  return <DataTable caption="Plan changes" rows={changes} rowKey={row => row.id} columns={[
    { key: "label", label: "Value", render: row => row.label }, { key: "committed", label: "Committed", render: row => row.committed ?? "Unavailable" },
    { key: "projected", label: "Projected", render: row => row.projected ?? "Unavailable" }
  ]} />;
}
export function PlanActionCard({ plan }: { plan: PlanPresentation }) {
  return <Card title={plan.title}><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
    <span>{plan.phase === "projected" ? "Projected" : "Committed"} · Action {plan.id}</span><StatusBadge {...plan.state} /></div>
    <KeyValueList items={[{ label: "Target", value: plan.targetLabel }, { label: "Dependency group", value: plan.dependencyGroupLabel }, { label: "Risk", value: plan.riskLabel }]} />
    <p className="m-0 text-xs text-muted-foreground tabular-nums">Evidence references: {plan.evidenceIds.length ? plan.evidenceIds.join(", ") : "None provided"}</p>
    <GateReasonList reasons={plan.reasons} /><PlanDiff changes={plan.changes} /><p className="m-0 text-xs text-muted-foreground">Approval is separate from Execute.</p>
  </Card>;
}
