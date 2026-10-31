/** Internal algorithm types; these are not API DTOs. Coordinates are WGS84 lon/lat. */
export type Coordinate = readonly [longitude: number, latitude: number];
export type Vehicle = "motorbike" | "car";
export interface GraphNode { readonly id: string; readonly coordinate: Coordinate }
export interface TravelPoint { readonly departureMs: number; readonly durationMs: number }
export type TravelProfile = readonly TravelPoint[];
export interface GraphEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly geometry: readonly Coordinate[];
  readonly vehicles: readonly Vehicle[];
  readonly travel: Readonly<Partial<Record<Vehicle, TravelProfile>>>;
}
export interface TurnBan {
  readonly incoming: string;
  readonly outgoing: string;
  readonly vehicles: readonly Vehicle[];
}
export interface GraphInput {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly turnBans: readonly TurnBan[];
}
export interface RoutingEdge extends GraphEdge { readonly lengthMeters: number }
export interface RoutingGraph {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly RoutingEdge[];
  readonly turnBans: readonly TurnBan[];
}
export interface RouteQuery {
  readonly from: string;
  readonly to: string;
  readonly vehicle: Vehicle;
  readonly departureMs: number;
  readonly incomingEdgeId?: string;
}
export interface RouteLeg {
  readonly edgeId: string;
  readonly enteredAtMs: number;
  readonly exitedAtMs: number;
}
export interface Route {
  readonly edgeIds: readonly string[];
  readonly legs: readonly RouteLeg[];
  readonly departureMs: number;
  readonly arrivalMs: number;
  readonly lengthMeters: number;
}
