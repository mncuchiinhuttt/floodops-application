import { PlanSchema } from "@floodops/contracts";
import { session } from "./fixtures";
const objective = { critical_unreachable: 0, critical_late: 0, critical_delay_minute: 0, food_late: 0, total_late: 0, total_delay_minute: 0, total_unreachable: 0 };
export const plan = PlanSchema.parse({ plan_id: "plan_fixture001", session_id: session.session_id, generation: 1, input_revision: 4, planning_job_id: "plan_fixture001ning-job",
  status: "ready", actions: [{ action_id: "action_fixture001", kind: "reroute", targets: { order_id: "order_fixture001", driver_id: "driver_entity001", hub_id: null, route_id: "route_fixture001", defer_minute: null },
    dependency_group_id: "group_fixture001", depends_on_action_ids: [], reason: "Synthetic fixture reroute preview", evidence_ids: ["evidence_fixture001"],
    rule_results: [{ rule_id: "POL-01", outcome: "pass", reason: "Fixture gate result only", entity_ids: ["segment_E270001"] }], status: "ready" }],
  groups: [{ group_id: "group_fixture001", action_ids: ["action_fixture001"], depends_on_group_ids: [] }], route_ids: ["route_fixture001"],
  objective_before: objective, objective_after: objective, diff: [{ entity_id: "order_fixture001", change: "changed", before_eta_minute: null, after_eta_minute: 32,
    reason: "Projected fixture delta", evidence_ids: ["evidence_fixture001"] }], is_projected: true });
