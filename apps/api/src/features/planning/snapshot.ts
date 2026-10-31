import { parseSchema } from "@floodops/contracts";
import type { SessionSnapshot } from "@floodops/contracts";
import type { SimulationRun } from "@floodops/simulation";
import type { TransitionContext } from "../../shared/index";
import { projectComparableResults } from "../results/index";
import { operationsProjection } from "../operations/projection";
import { calculateImpact } from "../incidents/impact";
import { createCommittedMovementPolicy } from "./committed-policy";
import { planningKnowledge } from "./source-context";
import { readPlanningState } from "./runtime-state";
export function capturedSessionSnapshot(context: TransitionContext, run: SimulationRun): SessionSnapshot {
  const state = readPlanningState(context.snapshot), pointers = context.snapshot.pointers;
  const results = projectComparableResults({ sessionId: context.snapshot.meta.session_id,
    branches: Object.keys(run.branches).map(branchId => ({ branchId: branchId as "static" | "floodops" | "reroute_only", run })) });
  return parseSchema("SessionSnapshot", { session: context.snapshot.meta, scenario: run.scenario.manifest.config.scenario,
    clock: { now_minute: run.nowMs / 60000, horizon_minute: run.scenario.manifest.config.horizon_minute,
      advance_job: null, mode: "paused", playback_controls_are_view_only: true },
    knowledge: planningKnowledge(run), operations: operationsProjection(run, state),
    impact: calculateImpact(run, state.incidents, createCommittedMovementPolicy(context, run)),
    latest_plan: pointers.latest_plan_id ? state.plans[pointers.latest_plan_id] ?? null : null,
    active_job: pointers.latest_requested_job_id ? state.jobs[pointers.latest_requested_job_id]?.job ?? null : null,
    results, graph_hash: run.scenario.manifest.graph.graph_hash });
}
