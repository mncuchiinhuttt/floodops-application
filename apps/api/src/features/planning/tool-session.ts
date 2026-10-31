/** Legacy contract adapter only. The M1 job calls typed internal services directly. */
import { parseToolInput } from "@floodops/contracts";
import type { ToolName } from "@floodops/contracts";
import { createPlanningServices } from "./internal-services";
export function createToolSession<State>(...args: Parameters<typeof createPlanningServices<State>>) {
  const services = createPlanningServices(...args);
  return { finalize: services.finalize, async execute(name: ToolName, raw: unknown) {
    switch (name) {
      case "get_incident_state": parseToolInput(name, raw); return services.getIncidentState();
      case "get_affected_orders": return services.getAffectedOrders(parseToolInput(name, raw));
      case "compute_route": return services.computeRoute(parseToolInput(name, raw));
      case "propose_assignment_change": return services.proposeAssignmentChange(parseToolInput(name, raw));
      case "propose_order_deferral": return services.proposeOrderDeferral(parseToolInput(name, raw));
      case "test_reassignment": return services.testReassignment(parseToolInput(name, raw));
      case "draft_customer_notification": return services.draftCustomerNotification(parseToolInput(name, raw));
      case "record_road_observation": return services.recordRoadObservation(parseToolInput(name, raw));
    }
  } };
}
