import type { Objective, Order } from "@floodops/contracts";

export function objectiveFromEtas(orders: readonly Order[], etas: Readonly<Record<string, number | null>>, horizon: number): Objective {
  if (!Number.isFinite(horizon) || horizon < 0) throw new Error("Invalid objective horizon.");
  const result: Objective = { critical_unreachable: 0, critical_late: 0, critical_delay_minute: 0,
    food_late: 0, total_late: 0, total_delay_minute: 0, total_unreachable: 0 };
  for (const order of orders) {
    const eta = etas[order.order_id];
    if (eta !== null && eta !== undefined && (!Number.isFinite(eta) || eta < 0)) throw new Error("Invalid projected ETA.");
    const unreachable = eta === null || eta === undefined;
    const late = unreachable ? horizon > order.original_sla_minute : eta > order.original_sla_minute;
    const delay = Math.max(0, (unreachable ? horizon : Math.min(eta, horizon)) - order.original_sla_minute);
    result.total_unreachable += Number(unreachable); result.total_late += Number(late); result.total_delay_minute += delay;
    if (order.tier === "critical") {
      result.critical_unreachable += Number(unreachable); result.critical_late += Number(late); result.critical_delay_minute += delay;
    }
    if (order.tier === "food") result.food_late += Number(late);
  }
  return result;
}
export function compareObjectives(a: Objective, b: Objective): number {
  const keys: (keyof Objective)[] = ["critical_unreachable", "critical_late", "critical_delay_minute",
    "food_late", "total_late", "total_delay_minute", "total_unreachable"];
  for (const key of keys) if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1;
  return 0;
}
