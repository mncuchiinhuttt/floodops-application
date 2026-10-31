import { ResultsSchema } from "@floodops/contracts";
import type { Results } from "@floodops/contracts";
import { assessCalibration, calculateObservedMetrics, relativeReduction } from "@floodops/simulation";
import { millisecondsToMinutes } from "@floodops/simulation/clock";
import { assertComparableSnapshots, resultBranchOrder } from "./comparable-snapshots.ts";
import type { ResultBranchSnapshot } from "./comparable-snapshots.ts";

export interface ResultsProjectionInput {
  sessionId: string;
  branches: readonly ResultBranchSnapshot[];
}

/** Observed log metrics only: projected ETAs never stand in for deliveries. */
export function projectComparableResults(input: ResultsProjectionInput): Results {
  assertComparableSnapshots(input.branches);
  const reference = input.branches[0]!.run;
  const config = reference.scenario.manifest.config;
  const observedUntil = millisecondsToMinutes(reference.nowMs);
  const branches = resultBranchOrder.flatMap(branchId => {
    const snapshot = input.branches.find(branch => branch.branchId === branchId);
    if (!snapshot) return [];
    const { run } = snapshot;
    return [{
      branch_id: branchId,
      metrics: calculateObservedMetrics(run.branches[branchId]!.operations.orders,
        run.log.filter(event => event.branch === branchId), observedUntil),
      completed_at_horizon: run.nowMs === run.scenario.horizonMs && run.pendingTargetMs === null
    }];
  });
  return ResultsSchema.parse({
    session_id: input.sessionId, scenario_id: config.scenario.scenario_id,
    scenario_version: config.scenario.version, config_hash: config.config_hash,
    horizon_minute: config.horizon_minute, observed_until_minute: observedUntil,
    calibration_status: assessCalibration(reference.scenario.manifest).status,
    branches, late_reduction_ratio: relativeReduction(branches[0]!.metrics.total_late,
      branches[1]!.metrics.total_late), label: "Simulation result"
  });
}
