import { freezeValue } from "@floodops/domain/operations";
import type { BranchId, SimulationRun } from "./run-types.ts";

/** Explicit owner-authorized retry of an already committed route, never a proposal Execute. */
export function retryCommittedRoute(input: SimulationRun, branch: BranchId, driverId: string): SimulationRun {
  if (input.pendingTargetMs !== null) throw new Error("ADVANCE_IN_PROGRESS");
  const run = structuredClone(input), state = run.branches[branch];
  const driver = state?.operations.drivers.find(item => item.driver_id === driverId);
  if (!driver || driver.status !== "waiting" || driver.position.kind !== "node") throw new Error("No waiting committed route.");
  driver.status = "idle";
  return freezeValue(run);
}
