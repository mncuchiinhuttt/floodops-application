import { Hono } from "hono";
import type { SimulationPersistence } from "@floodops/domain/public-ports";
import type { BranchId, SimulationRun } from "@floodops/simulation";
import { fail, invoke, runtimeCall, send } from "../../shared/index";
import type { AppEnv, ViewDefinition } from "../../shared/index";
import { projectComparableResults } from "./pure/index";

export const RESULTS_VIEW = "results";
export function createResultsView<State>(persistence: SimulationPersistence<SimulationRun, State>): ViewDefinition {
  return { permission: "results:read", roles: ["dispatcher", "viewer"], project({ snapshot }) {
    const run = persistence.read(snapshot.values);
    if (snapshot.meta.horizon_minute !== run.scenario.manifest.config.horizon_minute
      || snapshot.meta.sim_minute !== run.nowMs / 60000 || snapshot.meta.scenario_id !== persistence.reference.scenario_id
      || snapshot.meta.scenario_version !== persistence.reference.scenario_version || run.scenario.bundleHash !== persistence.reference.bundle_hash) fail(503, "CONFIG_INCOMPLETE");
    return projectComparableResults({ sessionId: snapshot.meta.session_id,
      branches: Object.keys(run.branches).map(branchId => ({ branchId: branchId as BranchId, run })) });
  } };
}
export function createResultsRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  router.get("/sessions/:session_id/results", async c => send(c,
    await invoke(c, runtimeCall(c, "view", { name: RESULTS_VIEW })), "getResults"));
  return router;
}
