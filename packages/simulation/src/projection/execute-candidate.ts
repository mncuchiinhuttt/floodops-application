import { freezeValue } from "@floodops/domain/operations";
import type { SimulationCandidate, SimulationPolicy, SimulationRun } from "../movement/run-types.ts";
import { appendLog } from "../movement/run-log.ts";
import { compareObjectives } from "./objective.ts";
import { projectCandidate, projectCurrent } from "./project-candidate.ts";

/** Pure transition for an already-authorized atomic Executor; never an HTTP/auth bypass. */
export function applyExecutedCandidate(input: SimulationRun, candidate: SimulationCandidate, policy: SimulationPolicy): SimulationRun {
  const current = projectCurrent(input, policy), projected = projectCandidate(input, candidate, policy);
  if (compareObjectives(projected.objective, current.objective) > 0) throw new Error("POL-05");
  const run = structuredClone(projected.candidateRun), branch = run.branches.floodops!;
  for (const order of branch.operations.orders) {
    const previous = input.branches.floodops!.operations.orders.find(item => item.order_id === order.order_id)!;
    if (order.driver_id !== previous.driver_id) appendLog(run, "floodops", "reassigned", { orderId: order.order_id, driverId: order.driver_id });
    const eta = projected.etas[order.order_id] ?? null;
    if (order.lifecycle !== "delivered") order.eta_minute = eta;
    if (order.eta_minute !== previous.eta_minute) appendLog(run, "floodops", "eta_preview", { orderId: order.order_id, driverId: order.driver_id });
  }
  return freezeValue(run);
}
