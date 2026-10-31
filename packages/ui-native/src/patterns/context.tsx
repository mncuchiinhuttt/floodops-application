import { Text, View } from "react-native";
import type { EvidenceItem, PresentationPhase, SourcePresentation } from "@floodops/design-tokens";
import { Alert, Card } from "../primitives/content";
import { ProvenanceBadge, StatusBadge } from "../primitives/badge";
import { styles } from "../primitives/styles";
import { KeyValueList } from "./accessible-list";
export function SimulationBanner() { return <Text style={styles.label}>Simulation · decisions affect this simulated session only.</Text>; }
export function CalibrationStatus({ status, detail }: { status: "incomplete" | "validated" | "failed"; detail: string }) {
  return <Alert title={{ incomplete: "Calibration incomplete", validated: "Calibration validated", failed: "Calibration failed" }[status]} tone={{ incomplete: "unknown" as const, validated: "ready" as const, failed: "blocked" as const }[status]}>{detail}</Alert>;
}
export function RuleId({ id }: { id: string }) { return <Text style={styles.label}>Rule {id}</Text>; }
export function MetricCard({ title, value, phase }: { title: string; value: string | number | null; phase?: PresentationPhase }) {
  return <Card title={title}><Text style={styles.heading}>{value ?? "Unavailable"}</Text>{phase && <Text style={styles.hint}>{phase === "projected" ? "Projected" : "Committed"}</Text>}</Card>;
}
export function SourceCard({ source }: { source: SourcePresentation }) {
  return <Card title={source.title}><ProvenanceBadge tone={source.provenance} /><StatusBadge {...source.freshness} />
    <KeyValueList items={[
      { label: "Provider", value: source.provider }, { label: "Type", value: source.typeLabel },
      { label: "Observed", value: source.observedLabel ?? "Unavailable" }, { label: "Expires", value: source.expiresLabel ?? "Unavailable" },
      { label: "Vehicle scope", value: source.vehicleLabel }
    ]} />
  </Card>;
}
export function EvidenceSummary({ items }: { items: readonly EvidenceItem[] }) {
  return <View style={styles.group}><Text accessibilityRole="header" style={styles.heading}>Evidence</Text>
    {!items.length ? <Text style={styles.hint}>No evidence available</Text> : items.map(item => <View key={item.id} style={styles.group}>
      <Text style={styles.label}>{item.title}</Text><StatusBadge {...item.state} /><Text style={styles.hint}>{item.detail}</Text>
      <Text style={styles.hint}>Evidence ID: {item.id}</Text>
    </View>)}
  </View>;
}
export function Toast({ message, urgent = false }: { message: string; urgent?: boolean }) {
  return <Text accessible accessibilityRole={urgent ? "alert" : "text"} accessibilityLiveRegion={urgent ? "assertive" : "polite"} style={styles.label}>{message}</Text>;
}
