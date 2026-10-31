import type { EvidenceItem, PresentationPhase, SourcePresentation } from "@floodops/design-tokens";
import { tokens } from "@floodops/design-tokens";
import { Alert, Card } from "../primitives/content";
import { ProvenanceBadge, StatusBadge } from "../primitives/badge";
import { KeyValueList } from "./data-table";

export function SimulationBanner() {
  const pair = tokens.semantic.provenance.simulated;
  return <aside aria-label="Simulation" className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium"
    style={{ color: pair.fg, backgroundColor: pair.bg, borderColor: pair.border }}>
    <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />Simulation · decisions affect this simulated session only.
  </aside>;
}
export function CalibrationStatus({ status, detail }: { status: "incomplete" | "validated" | "failed"; detail: string }) {
  return <Alert title={{ incomplete: "Calibration incomplete", validated: "Calibration validated", failed: "Calibration failed" }[status]} tone={{ incomplete: "unknown" as const, validated: "ready" as const, failed: "blocked" as const }[status]}>{detail}</Alert>;
}
export function RuleId({ id }: { id: string }) {
  return <span className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium tabular-nums">Rule {id}</span>;
}
export function MetricCard({ title, value, phase }: { title: string; value: string | number | null; phase?: PresentationPhase }) {
  return <Card title={title}><p className="m-0 text-3xl font-semibold tracking-tight tabular-nums">{value ?? "Unavailable"}</p>
    {phase && <p className="m-0 text-xs text-muted-foreground">{phase === "projected" ? "Projected" : "Committed"}</p>}</Card>;
}
export function SourceCard({ source }: { source: SourcePresentation }) {
  return <Card title={source.title}><div className="flex flex-wrap gap-2"><ProvenanceBadge tone={source.provenance} /> <StatusBadge {...source.freshness} /></div>
    <KeyValueList items={[
      { label: "Provider", value: source.provider }, { label: "Type", value: source.typeLabel },
      { label: "Observed", value: source.observedLabel ?? "Unavailable" }, { label: "Expires", value: source.expiresLabel ?? "Unavailable" },
      { label: "Vehicle scope", value: source.vehicleLabel }
    ]} />
  </Card>;
}
export function EvidenceSummary({ items }: { items: readonly EvidenceItem[] }) {
  return <section aria-label="Evidence" className="grid gap-2"><h3 className="m-0 text-sm font-semibold">Evidence</h3>
    {!items.length ? <p className="m-0 text-muted-foreground">No evidence available</p> : <ul className="m-0 grid list-none gap-2 p-0">{items.map(item => <li key={item.id} className="grid gap-1 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2"><strong className="font-medium">{item.title}</strong> <StatusBadge {...item.state} /></div>
      <p className="m-0 text-muted-foreground">{item.detail}</p><span className="text-xs text-muted-foreground tabular-nums">Evidence ID: {item.id}</span>
    </li>)}</ul>}</section>;
}
export function Toast({ message, urgent = false }: { message: string; urgent?: boolean }) {
  return <div role={urgent ? "alert" : "status"} aria-atomic="true" className="rounded-xl border bg-popover px-4 py-3 text-sm shadow-lg">{message}</div>;
}
