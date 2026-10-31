import type { EvidenceItem, PresentationPhase, SourcePresentation } from "@floodops/design-tokens";
import { Alert, Card } from "../primitives/content";
import { ProvenanceBadge, StatusBadge } from "../primitives/badge";
import { KeyValueList } from "./data-table";
export function SimulationBanner() { return <aside className="fo-simulation" aria-label="Simulation">Simulation · decisions affect this simulated session only.</aside>; }
export function CalibrationStatus({ status, detail }: { status: "incomplete" | "validated" | "failed"; detail: string }) {
  return <Alert title={{ incomplete: "Calibration incomplete", validated: "Calibration validated", failed: "Calibration failed" }[status]} tone={{ incomplete: "unknown" as const, validated: "ready" as const, failed: "blocked" as const }[status]}>{detail}</Alert>;
}
export function RuleId({ id }: { id: string }) { return <span className="fo-rule">Rule {id}</span>; }
export function MetricCard({ title, value, phase }: { title: string; value: string | number | null; phase?: PresentationPhase }) {
  return <Card title={title}><p className="fo-metric">{value ?? "Unavailable"}</p>{phase && <p>{phase === "projected" ? "Projected" : "Committed"}</p>}</Card>;
}
export function SourceCard({ source }: { source: SourcePresentation }) {
  return <Card title={source.title}><ProvenanceBadge tone={source.provenance} /> <StatusBadge {...source.freshness} />
    <KeyValueList items={[
      { label: "Provider", value: source.provider }, { label: "Type", value: source.typeLabel },
      { label: "Observed", value: source.observedLabel ?? "Unavailable" }, { label: "Expires", value: source.expiresLabel ?? "Unavailable" },
      { label: "Vehicle scope", value: source.vehicleLabel }
    ]} />
  </Card>;
}
export function EvidenceSummary({ items }: { items: readonly EvidenceItem[] }) {
  return <section aria-label="Evidence"><h3>Evidence</h3>{!items.length ? <p>No evidence available</p> : <ul>{items.map(item => <li key={item.id}>
    <strong>{item.title}</strong> <StatusBadge {...item.state} /><p>{item.detail}</p><span>Evidence ID: {item.id}</span>
  </li>)}</ul>}</section>;
}
export function Toast({ message, urgent = false }: { message: string; urgent?: boolean }) {
  return <div className="fo-toast" role={urgent ? "alert" : "status"} aria-atomic="true">{message}</div>;
}
