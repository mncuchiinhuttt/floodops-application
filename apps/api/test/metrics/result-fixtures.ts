import { createFunctionalScenario } from "@floodops/test-fixtures";
import { advanceRun, createRun, loadScenario, sealScenarioDraft } from "@floodops/simulation";
import type { SimulationPolicy, SimulationRun, RunLog } from "@floodops/simulation";
import type { ResultBranchSnapshot } from "../../src/features/results/pure/index.ts";

export const fixtureHash = (text: string) => new Bun.CryptoHasher("sha256").update(text).digest("hex");
export const highOnly: SimulationPolicy = { authorizeEntry: ({ knowledge }) => ({
  allowed: knowledge?.state === "known" && knowledge.confidence_band === "high", reason: "POL-02"
}) };
export function fixtureRun(atMinute = 20): SimulationRun {
  const manifest = sealScenarioDraft(createFunctionalScenario(), fixtureHash);
  const run = createRun(loadScenario(manifest, fixtureHash), "run_functional001");
  return atMinute === 0 ? run : advanceRun(run, atMinute, highOnly).run;
}
export function snapshots(run: SimulationRun, includeReroute = false): ResultBranchSnapshot[] {
  return ["static", "floodops", ...(includeReroute ? ["reroute_only"] : [])].map(branchId => ({
    branchId: branchId as ResultBranchSnapshot["branchId"], run
  }));
}
export function logEvent(branch: RunLog["branch"], kind: RunLog["kind"], atMinute: number,
  extra: Partial<RunLog> = {}): RunLog {
  return { branch, kind, atMinute, sequence: 1, driverId: null, orderId: null, segmentId: null,
    reason: null, attemptId: null, scope: null, afterIncident: false, category: null, ...extra };
}
