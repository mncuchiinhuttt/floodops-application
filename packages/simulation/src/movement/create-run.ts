import { cloneOperations, freezeValue } from "@floodops/domain/operations";
import type { LoadedScenario } from "../scenario/scenario-types.ts";
import type { BranchId, BranchState, SimulationRun } from "./run-types.ts";
import { appendLog } from "./run-log.ts";

export function createRun(scenario: LoadedScenario, runId: string, includeRerouteOnly = scenario.manifest.config.feature_flags.reroute_only_baseline): SimulationRun {
  if (!runId.trim()) throw new Error("An injected run ID is required.");
  const branches: Partial<Record<BranchId, BranchState>> = {};
  for (const id of ["static", "floodops", ...(includeRerouteOnly ? ["reroute_only"] : [])] as BranchId[]) {
    branches[id] = { operations: cloneOperations(scenario.manifest.initial), runtime: {} };
    for (const driver of branches[id]!.operations.drivers) {
      const route = scenario.manifest.initialRoutes.find(item => item.driver_id === driver.driver_id);
      branches[id]!.runtime[driver.driver_id] = { segments: route?.status === "candidate" ? [...route.segment_ids] : [],
        cursor: 0, incoming: null, serviceEndMs: null, activeStop: null, wakeAtMs: null, needsReroute: false };
    }
  }
  const run: SimulationRun = { scenario, runId, nowMs: 0, sourceSnapshot: structuredClone(scenario.manifest.sourceSnapshot), branches, knowledge: structuredClone(scenario.manifest.initialKnowledge),
    inputCursor: 0, incidentSeen: false, log: [], nextSequence: 1, pendingTargetMs: null,
    pickupUsage: { static: [], floodops: [], ...(includeRerouteOnly ? { reroute_only: [] } : {}) } };
  for (const [id, branch] of Object.entries(branches)) for (const order of branch.operations.orders) {
    if (order.lifecycle === "delivered") {
      if (order.delivered_at_minute !== 0) throw new Error("Initial completions must be at T0.");
      appendLog(run, id as BranchId, "delivery", { orderId: order.order_id, driverId: order.driver_id });
    }
  }
  return freezeValue(run);
}
