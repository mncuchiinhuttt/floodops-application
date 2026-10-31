import { Text, View } from "react-native";
import type { AwardPresentation, EventPresentation, GapPresentation, ResultsPresentation } from "@floodops/design-tokens";
import { Card } from "../primitives/content";
import { StatusBadge, ProvenanceBadge } from "../primitives/badge";
import { styles } from "../primitives/styles";
import { AccessibleList } from "./accessible-list";
export function GapCoverage({ gaps }: { gaps: readonly GapPresentation[] }) {
  return <Card title="Gap coverage">{!gaps.length ? <Text style={styles.hint}>No gaps provided</Text> : gaps.map(gap => <View key={gap.id} style={styles.group}>
    <Text style={styles.label}>{gap.segmentLabel} · {gap.vehicleLabel}</Text><StatusBadge {...gap.state} /><Text style={styles.hint}>{gap.detail}</Text>
  </View>)}</Card>;
}
export function PointsLedger({ entries }: { entries: readonly AwardPresentation[] }) {
  return <Card title="Points ledger"><ProvenanceBadge tone="simulated" /><AccessibleList caption="Simulated point entries" rows={entries} rowKey={row => row.id} columns={[
    { key: "label", label: "Entry", render: row => row.label }, { key: "points", label: "Points", render: row => row.points ?? "Unavailable" },
    { key: "reason", label: "Reason", render: row => row.reason }, { key: "time", label: "Simulation time", render: row => row.timeLabel }
  ]} /><Text style={styles.hint}>Entries are supplied by the server; acceptance alone does not imply an award.</Text></Card>;
}
export function EventTimeline({ events }: { events: readonly EventPresentation[] }) {
  return <Card title="Event timeline">{!events.length ? <Text style={styles.hint}>No events available</Text> : events.map(event => <View key={event.id} style={styles.group}>
    <Text style={styles.label}>Event sequence {event.sequence}</Text><Text style={styles.hint}>Simulation time: {event.timeLabel} · Actor: {event.actorLabel}</Text><Text style={styles.hint}>{event.description}</Text>
  </View>)}</Card>;
}
export function ResultComparison({ results }: { results: ResultsPresentation }) {
  return <Card title={results.title}><Text style={styles.label}>Simulation · {results.phase === "projected" ? "Projected" : "Committed"} results</Text>
    <Text style={styles.hint}>Evaluation horizon: {results.horizonLabel}</Text><Text style={styles.hint}>{results.calibrationLabel}</Text>
    <AccessibleList caption="Baseline and FloodOps" rows={results.rows} rowKey={row => row.id} columns={[
      { key: "label", label: "Metric", render: row => row.label }, { key: "baseline", label: "Baseline", render: row => row.baseline ?? "Unavailable" },
      { key: "floodops", label: "FloodOps", render: row => row.floodops ?? "Unavailable" }
    ]} />
  </Card>;
}
