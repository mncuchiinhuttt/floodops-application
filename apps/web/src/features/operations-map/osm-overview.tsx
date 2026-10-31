import { useMemo } from "react";
import type { Graph, Knowledge, OperationalBranch, Route, VehicleType } from "@floodops/contracts";
import { mapLineStyle, mapRouteStyle } from "@floodops/design-tokens";
import { LeafletMap, type MapLine, type MapPin } from "./leaflet-map";
import { activeRoutes, entityMarkers, segmentState } from "./map-model";

export interface OsmOverviewProps {
  graph: Graph; knowledge: Knowledge | null; knowledgeCurrent: boolean; branch: OperationalBranch | null;
  routes: readonly Route[]; vehicle: VehicleType; minute: number;
}
/** Dispatcher basemap: OpenStreetMap tiles under the server's road geometry, coloured by current knowledge for the selected vehicle. */
export function OsmOverview({ graph, knowledge, knowledgeCurrent, branch, routes, vehicle, minute }: OsmOverviewProps) {
  const lines = useMemo<MapLine[]>(() => {
    const roads = graph.segments.map(road => {
      const state = segmentState(road, knowledge, vehicle, minute, knowledgeCurrent), style = mapLineStyle({ state });
      return { id: road.segment_id, points: road.polyline, color: style.color, dash: style.dash, weight: 7, title: `${road.segment_id} · ${state.label}` };
    });
    const route = mapRouteStyle("primary");
    const shown = route ? activeRoutes(graph, branch, routes, vehicle).accepted.flatMap(item => item.segment_ids.flatMap((id, index) => {
      const road = graph.segments.find(segment => segment.segment_id === id);
      return road ? [{ id: `${item.route_id}:${index}`, points: road.polyline, color: route.color, weight: 3, title: `Route ${item.route_id}` }] : [];
    })) : [];
    return [...roads, ...shown];
  }, [graph, knowledge, knowledgeCurrent, branch, routes, vehicle, minute]);
  const pins = useMemo<MapPin[]>(() => entityMarkers(graph, branch).flatMap(marker => marker.coordinate
    ? [{ id: marker.id, at: [marker.coordinate[0], marker.coordinate[1]] as const, label: marker.label, tone: "entity" as const }] : []), [graph, branch]);
  return <LeafletMap label="Bản đồ OpenStreetMap với hình học đường của server" lines={lines} pins={pins} fitKey={graph.graph_hash} className="h-[28rem] lg:h-[34rem]" />;
}
