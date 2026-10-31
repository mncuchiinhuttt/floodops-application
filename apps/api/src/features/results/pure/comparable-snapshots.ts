import { canonicalJson } from "@floodops/simulation";
import type { BranchId, SimulationRun } from "@floodops/simulation";
import { millisecondsToMinutes, minutesToMilliseconds } from "@floodops/simulation/clock";

export interface ResultBranchSnapshot {
  branchId: BranchId;
  run: Readonly<SimulationRun>;
}

export const resultBranchOrder: readonly BranchId[] = ["static", "floodops", "reroute_only"];

function comparisonKey(run: Readonly<SimulationRun>): string {
  const { config } = run.scenario.manifest;
  if (run.scenario.horizonMs !== minutesToMilliseconds(config.horizon_minute)
    || run.nowMs > run.scenario.horizonMs) throw new Error("Invalid result observation horizon.");
  millisecondsToMinutes(run.nowMs);
  return canonicalJson({
    runId: run.runId, scenario: config.scenario, configHash: config.config_hash,
    seedHash: config.seed_hash, seed: run.scenario.manifest.seed,
    graphHash: config.graph_hash, bundleHash: run.scenario.bundleHash,
    horizonMs: run.scenario.horizonMs, nowMs: run.nowMs, inputCursor: run.inputCursor,
    pendingTargetMs: run.pendingTargetMs, sourceSnapshot: run.sourceSnapshot,
    knowledge: run.knowledge, sharedLog: run.log.filter(event => event.branch === null)
  });
}

export function assertComparableSnapshots(snapshots: readonly ResultBranchSnapshot[]): void {
  if (snapshots.length < 2 || snapshots.length > 3) throw new Error("Results require two or three branches.");
  const ids = new Set(snapshots.map(snapshot => snapshot.branchId));
  if (ids.size !== snapshots.length || !ids.has("static") || !ids.has("floodops")
    || [...ids].some(id => !resultBranchOrder.includes(id))) throw new Error("Invalid or duplicate result branches.");
  const key = comparisonKey(snapshots[0]!.run);
  for (const { branchId, run } of snapshots) {
    if (!run.branches[branchId]) throw new Error("Result branch is unavailable.");
    if (comparisonKey(run) !== key) throw new Error("Result snapshots are not comparable.");
    const original = new Map(run.scenario.manifest.initial.orders.map(order => [order.order_id, order]));
    const orders = run.branches[branchId]!.operations.orders;
    if (original.size !== orders.length || new Set(orders.map(order => order.order_id)).size !== orders.length
      || orders.some(order => {
        const initial = original.get(order.order_id);
        return !initial || initial.tier !== order.tier || initial.original_sla_minute !== order.original_sla_minute;
      })) throw new Error("Result orders changed their immutable cohort, tier or original SLA.");
  }
}
