import { parseSchema } from "@floodops/contracts";
import type { Impact, Incident } from "@floodops/contracts";
import { projectCurrent } from "@floodops/simulation";
import type { SimulationPolicy, SimulationRun } from "@floodops/simulation";
export function calculateImpact(run: SimulationRun, incidents: readonly Incident[], policy: SimulationPolicy): Impact {
  const affected = new Set(incidents.flatMap(i => i.affected_segment_ids)), branch = run.branches.floodops!;
  const projection = projectCurrent(run, policy), horizon = run.scenario.manifest.config.horizon_minute;
  const orders = branch.operations.orders.flatMap(order => {
    if (order.lifecycle === "delivered" || !order.driver_id) return [];
    const driver = branch.operations.drivers.find(d => d.driver_id === order.driver_id)!;
    const runtime = branch.runtime[driver.driver_id]!;
    const path = [...runtime.segments.slice(runtime.cursor), ...(driver.position.segment_id ? [driver.position.segment_id] : [])];
    const causes = [...new Set(path.filter(id => affected.has(id)))];
    const eta = projection.etas[order.order_id] ?? null;
    return causes.length ? [{ order_id: order.order_id, driver_id: order.driver_id, cause_segment_ids: causes,
      predicted_lateness_minute: Math.max(0, (eta ?? horizon) - order.original_sla_minute), tier: order.tier, is_unreachable: eta === null }] : [];
  });
  const rank = { critical: 0, food: 1, standard: 2 };
  orders.sort((a, b) => rank[a.tier] - rank[b.tier] || b.predicted_lateness_minute - a.predicted_lateness_minute
    || (a.order_id < b.order_id ? -1 : a.order_id > b.order_id ? 1 : 0));
  return parseSchema("Impact", { incident_ids: incidents.map(i => i.incident_id), affected_orders: orders,
    affected_driver_ids: [...new Set(orders.map(o => o.driver_id))], priority_order_ids: orders.map(o => o.order_id) });
}
