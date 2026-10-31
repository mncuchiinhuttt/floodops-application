/** Published synthetic scenario data, used only for renderer tests. */
import manifest from "../../../data/scenarios/functional-v2/manifest.json";
import { GraphSchema, KnowledgeSchema, OperationalBranchSchema, RouteSchema } from "@floodops/contracts";
export const graph = GraphSchema.parse(manifest.graph);
export const knowledge = KnowledgeSchema.parse({ segments: manifest.initialKnowledge, observations: manifest.sourceSnapshot.observations,
  restrictions: manifest.sourceSnapshot.restrictions, coverage: { covered_pairs: 0, relevant_pairs: 0, ratio: null } });
export const routes = manifest.initialRoutes.map(route => RouteSchema.parse(route));
export const branch = OperationalBranchSchema.parse({ branch_id: "floodops", drivers: manifest.initial.drivers, orders: manifest.initial.orders,
  hubs: manifest.initial.hubs, active_route_ids: routes.map(route => route.route_id) });
