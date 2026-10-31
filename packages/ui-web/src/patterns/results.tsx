import type { AwardPresentation, EventPresentation, GapPresentation, ResultsPresentation } from "@floodops/design-tokens";
import { Card } from "../primitives/content";
import { StatusBadge, ProvenanceBadge } from "../primitives/badge";
import { DataTable } from "./data-table";

export function GapCoverage({ gaps }: { gaps: readonly GapPresentation[] }) {
  return <Card title="Gap coverage">{!gaps.length ? <p className="m-0 text-muted-foreground">No gaps provided</p> : <ul className="m-0 grid list-none gap-2 p-0">{gaps.map(gap => <li key={gap.id} className="grid gap-1 rounded-lg border p-3">
    <div className="flex flex-wrap items-center gap-2"><strong className="font-medium">{gap.segmentLabel} · {gap.vehicleLabel}</strong> <StatusBadge {...gap.state} /></div>
    <p className="m-0 text-muted-foreground">{gap.detail}</p>
  </li>)}</ul>}</Card>;
}
export function PointsLedger({ entries }: { entries: readonly AwardPresentation[] }) {
  return <Card title="Points ledger"><div><ProvenanceBadge tone="simulated" /></div><DataTable caption="Simulated point entries" rows={entries} rowKey={row => row.id} columns={[
    { key: "label", label: "Entry", render: row => row.label }, { key: "points", label: "Points", render: row => row.points ?? "Unavailable" },
    { key: "reason", label: "Reason", render: row => row.reason }, { key: "time", label: "Simulation time", render: row => row.timeLabel }
  ]} /><p className="m-0 text-xs text-muted-foreground">Entries are supplied by the server; acceptance alone does not imply an award.</p></Card>;
}
export function EventTimeline({ events }: { events: readonly EventPresentation[] }) {
  return <Card title="Event timeline">{!events.length ? <p className="m-0 text-muted-foreground">No events available</p> : <ol className="m-0 grid list-none gap-0 p-0">{events.map(event => <li key={event.id} className="grid gap-0.5 border-l-2 border-border py-2 pl-4 first:pt-0 last:pb-0">
    <strong className="font-medium tabular-nums">Event sequence {event.sequence}</strong>
    <p className="m-0 text-xs text-muted-foreground tabular-nums">Simulation time: {event.timeLabel} · Actor: {event.actorLabel}</p><p className="m-0">{event.description}</p>
  </li>)}</ol>}</Card>;
}
export function ResultComparison({ results }: { results: ResultsPresentation }) {
  return <Card title={results.title}><p className="m-0 text-xs text-muted-foreground">Simulation · {results.phase === "projected" ? "Projected" : "Committed"} results</p>
    <p className="m-0 tabular-nums">Evaluation horizon: {results.horizonLabel}</p><p className="m-0 text-muted-foreground">{results.calibrationLabel}</p>
    <DataTable caption="Baseline and FloodOps" rows={results.rows} rowKey={row => row.id} columns={[
      { key: "label", label: "Metric", render: row => row.label }, { key: "baseline", label: "Baseline", render: row => row.baseline ?? "Unavailable" },
      { key: "floodops", label: "FloodOps", render: row => row.floodops ?? "Unavailable" }
    ]} />
  </Card>;
}
