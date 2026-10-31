import { Text, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import type { Graph, SegmentKnowledge, VehicleType } from "@floodops/contracts";
import { tokens } from "@floodops/design-tokens";
export function OperationsMap({ graph, knowledge, vehicle }: { graph: Graph; knowledge: readonly SegmentKnowledge[]; vehicle: VehicleType }) {
  const coordinates = graph.segments.flatMap(segment => segment.polyline);
  if (!coordinates.length) return <Text>No graph geometry available.</Text>;
  const anchor = coordinates[0]!;
  const ratio = Math.cos(anchor[1] * Math.PI / 180);
  const xs = coordinates.map(point => (point[0] - anchor[0]) * ratio);
  const ys = coordinates.map(point => -(point[1] - anchor[1]));
  const width = Math.max(...xs) - Math.min(...xs) || 0.001;
  const height = Math.max(...ys) - Math.min(...ys) || 0.001;
  const pad = Math.max(width, height) * 0.05;
  const project = (point: readonly number[]) => `${(point[0]! - anchor[0]) * ratio},${-(point[1]! - anchor[1])}`;
  return <View>
    <Text>Geometry view · {vehicle} · Distances from server graph</Text>
    <Svg width="100%" height={240} accessibilityRole="image" accessibilityLabel={`Road geometry for ${vehicle}; detailed text list follows`}
      viewBox={`${Math.min(...xs) - pad} ${Math.min(...ys) - pad} ${width + pad * 2} ${height + pad * 2}`} preserveAspectRatio="xMidYMid meet">
      {graph.segments.map(segment => {
        const state = knowledge.find(item => item.segment_id === segment.segment_id && item.vehicle_type === vehicle);
        const blocked = state?.state === "authoritative_closed" || state?.condition === "impassable";
        const uncertain = !state || state.state === "ordinary_unknown" || state.state === "unresolved_conflict";
        return <Polyline key={segment.segment_id} points={segment.polyline.map(project).join(" ")} fill="none"
          stroke={blocked ? tokens.semantic.status.blocked.fg : uncertain ? tokens.semantic.status.replan.fg : tokens.semantic.text.primary}
          strokeWidth={Math.max(width, height) / 130} strokeDasharray={uncertain ? `${width / 70} ${width / 100}` : undefined} />;
      })}
    </Svg>
    <Text>Legend: blocked = closed/impassable; dashed = unknown/conflict. Vehicle evidence is separate.</Text>
    {graph.segments.map(segment => {
      const state = knowledge.find(item => item.segment_id === segment.segment_id && item.vehicle_type === vehicle);
      return <Text key={segment.segment_id}>{segment.segment_id} · {segment.length_m} m · {state?.state ?? "ordinary_unknown"} · {state?.condition ?? "unknown"}</Text>;
    })}
  </View>;
}
