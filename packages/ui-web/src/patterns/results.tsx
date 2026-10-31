import type { AwardPresentation, EventPresentation, GapPresentation, ResultsPresentation } from "@floodops/design-tokens";
import { Card } from "../primitives/content";
import { StatusBadge, ProvenanceBadge } from "../primitives/badge";
import { DataTable } from "./data-table";
export function GapCoverage({ gaps }: { gaps: readonly GapPresentation[] }) {
  return <Card title="Gap coverage">{!gaps.length ? <p>No gaps provided</p> : <ul>{gaps.map(gap => <li key={gap.id}>
    <strong>{gap.segmentLabel} · {gap.vehicleLabel}</strong> <StatusBadge {...gap.state} /><p>{gap.detail}</p>
  </li>)}</ul>}</Card>;
}
export function PointsLedger({ entries }: { entries: readonly AwardPresentation[] }) {
  return <Card title="Points ledger"><ProvenanceBadge tone="simulated" /><DataTable caption="Simulated point entries" rows={entries} rowKey={row => row.id} columns={[
    { key: "label", label: "Entry", render: row => row.label }, { key: "points", label: "Points", render: row => row.points ?? "Unavailable" },
    { key: "reason", label: "Reason", render: row => row.reason }, { key: "time", label: "Simulation time", render: row => row.timeLabel }
  ]} /><p className="fo-hint">Entries are supplied by the server; acceptance alone does not imply an award.</p></Card>;
}
export function EventTimeline({ events }: { events: readonly EventPresentation[] }) {
  return <Card title="Event timeline">{!events.length ? <p>No events available</p> : <ol>{events.map(event => <li key={event.id}>
    <strong>Event sequence {event.sequence}</strong><p>Simulation time: {event.timeLabel} · Actor: {event.actorLabel}</p><p>{event.description}</p>
  </li>)}</ol>}</Card>;
}
export function ResultComparison({ results }: { results: ResultsPresentation }) {
  return <Card title={results.title}><p>Simulation · {results.phase === "projected" ? "Projected" : "Committed"} results</p>
    <p>Evaluation horizon: {results.horizonLabel}</p><p>{results.calibrationLabel}</p>
    <DataTable caption="Baseline and FloodOps" rows={results.rows} rowKey={row => row.id} columns={[
      { key: "label", label: "Metric", render: row => row.label }, { key: "baseline", label: "Baseline", render: row => row.baseline ?? "Unavailable" },
      { key: "floodops", label: "FloodOps", render: row => row.floodops ?? "Unavailable" }
    ]} />
  </Card>;
}
