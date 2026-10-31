import type { Metrics, Order } from "@floodops/contracts";
import type { RunLog } from "../movement/run-types.ts";

export function calculateObservedMetrics(orders: readonly Order[], log: readonly RunLog[], horizon: number): Metrics {
  if (!Number.isFinite(horizon) || horizon < 0) throw new Error("Invalid observed horizon.");
  const relevant = log.filter(event => event.atMinute <= horizon);
  const completion = new Map<string, number>();
  for (const event of relevant) if (event.kind === "delivery" && event.orderId) {
    if (completion.has(event.orderId)) throw new Error("Duplicate observed completion.");
    completion.set(event.orderId, event.atMinute);
  }
  const metrics: Metrics = { critical_late: 0, total_late: 0, total_delay_minutes: 0,
    blocked_route_attempts: 0, blocked_proposal_attempts: 0, blocked_movement_attempts: 0,
    orders_reassigned: 0, updated_eta_previews: 0, unfinished_count: 0, unreachable_count: 0, executed_violations: 0 };
  for (const order of orders) {
    const delivered = completion.get(order.order_id);
    const late = (delivered ?? horizon) > order.original_sla_minute;
    metrics.total_late += Number(late); metrics.critical_late += Number(late && order.tier === "critical");
    metrics.total_delay_minutes += Math.max(0, (delivered ?? horizon) - order.original_sla_minute);
    metrics.unfinished_count += Number(delivered === undefined);
    metrics.unreachable_count += Number(delivered === undefined && order.eta_minute === null);
  }
  const attempts = (scope?: "proposal" | "movement") => new Set(relevant.filter(event => event.kind === "blocked" && event.category === "road"
    && (!scope || event.scope === scope) && event.attemptId !== null).map(event => event.attemptId)).size;
  metrics.blocked_route_attempts = attempts(); metrics.blocked_proposal_attempts = attempts("proposal"); metrics.blocked_movement_attempts = attempts("movement");
  metrics.orders_reassigned = new Set(relevant.filter(event => event.kind === "reassigned" && event.afterIncident).map(event => event.orderId)).size;
  metrics.updated_eta_previews = new Set(relevant.filter(event => event.kind === "eta_preview").map(event => event.orderId)).size;
  metrics.executed_violations = relevant.filter(event => event.kind === "executed_violation").length;
  return metrics;
}
export function relativeReduction(baseline: number, candidate: number): number | null {
  if (![baseline, candidate].every(value => Number.isFinite(value) && value >= 0)) throw new Error("Invalid metric comparison.");
  return baseline === 0 ? null : (baseline - candidate) / baseline;
}
