import { Text, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { assertMapPresentation, mapLineStyle, mapPath, mapRouteStyle, tokens } from "@floodops/design-tokens";
import type { MapMarker, MapPresentation, RoutePresentation } from "@floodops/design-tokens";
import { Icon } from "@floodops/icons/native";
import { Button } from "../primitives/button";
import { Card } from "../primitives/content";
import { StatusBadge } from "../primitives/badge";
import { styles } from "../primitives/styles";
export function MapEntityMarker({ marker, onSelect }: { marker: MapMarker; onSelect?: (id: string) => void }) {
  if (!marker.label.trim()) throw new Error("Map markers require visible labels.");
  return onSelect ? <Button variant="secondary" label={marker.label} icon={marker.kind} onPress={() => onSelect(marker.id)} />
    : <View style={{ flexDirection: "row", gap: tokens.space[2] }}><Icon name={marker.kind} decorative /><Text style={styles.label}>{marker.label}</Text></View>;
}
export function MapLegend() {
  return <View style={styles.group}><Text accessibilityRole="header" style={styles.label}>Map legend</Text>
    {(["closed", "congestion", "unknown", "conflict"] as const).map(tone => { const style = mapLineStyle({ state: { tone, label: tone } }); return <View key={tone} style={{ flexDirection: "row", alignItems: "center", gap: tokens.space[2] }}>
      <Svg width={48} height={12} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Path d="M0 6H48" fill="none" stroke={style.color} strokeDasharray={style.dash} strokeWidth={3} /></Svg>
      <StatusBadge tone={tone} label={{ closed: "Closed", congestion: "Congestion", unknown: "Unknown", conflict: "Conflict" }[tone]} />
    </View>; })}
    <Text style={styles.hint}>Outer stroke: segment state. Thin inner stroke: route display. Solid inner line: primary route. Dashed inner line: alternative route.</Text>
    <Text style={styles.hint}>Route display does not grant approval or prove passability.</Text>
  </View>;
}
export function MapCanvas({ scene, onSelectMarker }: { scene: MapPresentation; onSelectMarker?: (id: string) => void }) {
  assertMapPresentation(scene);
  return <Card title={scene.title}><View style={{ width: "100%", aspectRatio: scene.width / scene.height }}>
    <Svg width="100%" height="100%" viewBox={`0 0 ${scene.width} ${scene.height}`} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {scene.lines.map(line => { const style = mapLineStyle(line); const route = mapRouteStyle(line.route); const path = mapPath(line.points); return <G key={line.id}>
        <Path d={path} fill="none" stroke={style.color} strokeDasharray={style.dash} strokeWidth={route ? 8 : 3} />
        {route && <><Path d={path} fill="none" stroke={tokens.semantic.surface.panel} strokeWidth={4} />
          <Path d={path} fill="none" stroke={route.color} strokeDasharray={route.dash} strokeWidth={2} /></>}
      </G>; })}
      {scene.markers.map(marker => <Circle key={marker.id} cx={marker.x} cy={marker.y} r={4} fill={tokens.semantic.action.primary.bg} />)}
    </Svg></View><Text style={styles.hint}>Scale: {scene.scaleLabel} · Vehicle scope: {scene.vehicleLabel}</Text>
    <MapLegend /><Text accessibilityRole="header" style={styles.label}>Map segments</Text>
    {scene.lines.map(line => <View key={line.id} style={styles.group}><Text style={styles.label}>{line.label}</Text><StatusBadge {...line.state} /><Text style={styles.hint}>{line.detail}</Text></View>)}
    <Text accessibilityRole="header" style={styles.label}>Map markers</Text>
    {scene.markers.map(marker => <MapEntityMarker key={marker.id} marker={marker} onSelect={onSelectMarker} />)}
  </Card>;
}
export function RouteSummary({ route }: { route: RoutePresentation }) {
  return <Card title={route.title}><Text style={styles.label}>{route.phase === "projected" ? "Projected" : "Committed"} route</Text>
    <Text style={styles.label}>Simulation ETA: {route.etaLabel ?? "Unavailable"}</Text><Text style={styles.hint}>{route.detail}</Text>
    {route.segments.length ? route.segments.map((label, index) => <Text key={index} style={styles.hint}>{index + 1}. {label}</Text>) : <Text style={styles.hint}>No route segments</Text>}
  </Card>;
}
