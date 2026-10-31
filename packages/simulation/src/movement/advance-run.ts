import { freezeValue } from "@floodops/domain/operations";
import type { AdvanceResult, BranchId, SimulationPolicy, SimulationRun } from "./run-types.ts";
import { applySharedInputs } from "./shared-inputs.ts";
import { settleDriver } from "./settle-driver.ts";
import { millisecondsToMinutes, minutesToMilliseconds } from "../clock/index.ts";

function settle(run: SimulationRun, policy: SimulationPolicy): void {
  applySharedInputs(run);
  for (const [id, branch] of Object.entries(run.branches)) {
    for (const driver of [...branch.operations.drivers].sort((a, b) => a.driver_id < b.driver_id ? -1 : a.driver_id > b.driver_id ? 1 : 0)) {
      settleDriver(run, id as BranchId, driver, policy);
    }
  }
}
function nextBoundary(run: SimulationRun, targetMs: number): number {
  const future = [targetMs];
  for (const event of run.scenario.manifest.events) {
    const time = minutesToMilliseconds(event.atMinute); if (time > run.nowMs) future.push(time);
  }
  for (const knowledge of run.knowledge) if (knowledge.expires_sim_minute !== null) {
    const time = minutesToMilliseconds(knowledge.expires_sim_minute); if (time > run.nowMs) future.push(time);
  }
  for (const branch of Object.values(run.branches)) for (const driver of branch.operations.drivers) {
    const runtime = branch.runtime[driver.driver_id]!;
    for (const value of [runtime.serviceEndMs, runtime.wakeAtMs,
      driver.position.kind === "on_edge" ? minutesToMilliseconds(driver.position.exit_sim_minute!) : null]) {
      if (value !== null && value > run.nowMs) future.push(value);
    }
  }
  return Math.min(...future);
}
/** Internal projection may look beyond H; normal advanceRun always enforces H. */
export function advanceInternal(input: SimulationRun, targetMs: number, policy: SimulationPolicy, maxBoundaries: number): AdvanceResult {
  if (!Number.isSafeInteger(targetMs) || targetMs <= input.nowMs || !Number.isSafeInteger(maxBoundaries) || maxBoundaries < 1
    || (input.pendingTargetMs !== null && targetMs !== input.pendingTargetMs)) throw new Error("Invalid target/budget or changed resumable target.");
  const run = structuredClone(input); run.pendingTargetMs = targetMs;
  settle(run, policy);
  for (let count = 0; count < maxBoundaries && run.nowMs < targetMs; count++) {
    run.nowMs = nextBoundary(run, targetMs); settle(run, policy);
  }
  const complete = run.nowMs === targetMs;
  if (complete) run.pendingTargetMs = null;
  return freezeValue({ run, complete, targetMinute: millisecondsToMinutes(targetMs) });
}
export function advanceRun(input: SimulationRun, targetMinute: number, policy: SimulationPolicy,
  options: { maxBoundaries?: number } = {}): AdvanceResult {
  const targetMs = minutesToMilliseconds(targetMinute);
  if (targetMs > input.scenario.horizonMs) throw new Error("Advance exceeds scenario H.");
  return advanceInternal(input, targetMs, policy, options.maxBoundaries ?? 1000);
}
