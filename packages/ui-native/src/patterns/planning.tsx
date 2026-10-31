import { Text, View } from "react-native";
import type { ComparisonRow, GateReasonPresentation, PlanPresentation } from "@floodops/design-tokens";
import { Card } from "../primitives/content";
import { StatusBadge } from "../primitives/badge";
import { styles } from "../primitives/styles";
import { RuleId } from "./context";
import { AccessibleList, KeyValueList } from "./accessible-list";
export function GateReasonList({ reasons }: { reasons: readonly GateReasonPresentation[] }) {
  return <View style={styles.group}><Text accessibilityRole="header" style={styles.label}>Gate reasons</Text>
    {!reasons.length ? <Text style={styles.hint}>No gate reasons provided</Text> : reasons.map(reason => <View key={reason.id} style={styles.group}>
      <RuleId id={reason.ruleId} /><Text style={styles.label}>{reason.label}</Text><Text style={styles.hint}>{reason.detail}</Text>
      <Text style={styles.hint}>Evidence: {reason.evidenceIds.length ? reason.evidenceIds.join(", ") : "None provided"}</Text>
    </View>)}
  </View>;
}
export function PlanDiff({ changes }: { changes: readonly ComparisonRow[] }) {
  return <AccessibleList caption="Plan changes" rows={changes} rowKey={row => row.id} columns={[
    { key: "label", label: "Value", render: row => row.label }, { key: "committed", label: "Committed", render: row => row.committed ?? "Unavailable" },
    { key: "projected", label: "Projected", render: row => row.projected ?? "Unavailable" }
  ]} />;
}
export function PlanActionCard({ plan }: { plan: PlanPresentation }) {
  return <Card title={plan.title}><Text style={styles.label}>{plan.phase === "projected" ? "Projected" : "Committed"} · Action {plan.id}</Text><StatusBadge {...plan.state} />
    <KeyValueList items={[{ label: "Target", value: plan.targetLabel }, { label: "Dependency group", value: plan.dependencyGroupLabel }, { label: "Risk", value: plan.riskLabel }]} />
    <Text style={styles.hint}>Evidence references: {plan.evidenceIds.length ? plan.evidenceIds.join(", ") : "None provided"}</Text>
    <GateReasonList reasons={plan.reasons} /><PlanDiff changes={plan.changes} /><Text style={styles.hint}>Approval is separate from Execute.</Text>
  </Card>;
}
