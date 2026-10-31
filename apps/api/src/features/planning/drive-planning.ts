import { createHash } from "node:crypto";
import { PlanningSearchStopped } from "./deterministic-types";
import type { PlanningJob } from "@floodops/contracts";
import { PlatformError } from "../../shared/index";
import type { Call, Reply, TransitionContext } from "../../shared/index";
import type { PlanningMaterial, ResolvedPlanningOptions } from "./runtime-types";
import { PLAN_BEGIN, PLAN_COMPLETE, PLANNING_VIEW } from "./runtime-types";
import { runtimeRun } from "./runtime-context";
import { runDeterministicPlanner } from "./deterministic-planner";
export type PlanningDispatch = (call: Call) => Promise<Reply>;
export interface PlanningReservation { job: PlanningJob; execution: PlanningMaterial | null }
export async function drivePlanning<State>(dispatch: PlanningDispatch, call: Call, reply: Reply, options: ResolvedPlanningOptions<State>): Promise<void> {
  const reserved = reply.body.data as PlanningReservation;
  if (reply.status !== 200 || !reserved.execution) return;
  const material = reserved.execution, attemptId = "attempt_" + crypto.randomUUID();
  const authority = { job_id: material.jobId, lease_id: material.leaseId, nonce: material.nonce, attempt_id: attemptId };
  const invoke = (name: string, input: unknown) => dispatch({ ...call, kind: "command", name,
    key: "plan_" + createHash("sha256").update(name + attemptId).digest("hex"), path: "/internal/planning/" + material.jobId,
    payload: input, fence: { lease_id: material.leaseId, nonce: material.nonce },
    expectedPointers: { latest_requested_job_id: material.jobId } });
  let begun: Reply; try { begun = await invoke(PLAN_BEGIN, authority); } catch { return; }
  if (begun.status !== 200) return;
  const data = begun.body.data as { claimed: boolean; context: TransitionContext; planId: string; deadline: number };
  if (!data.claimed) return;
  let outcome: unknown;
  try {
    const run = runtimeRun(data.context, options);
    const proposal = await runDeterministicPlanner(data.context, run, material.jobId, data.planId, options, options.limits, {
      deadline: data.deadline, current: async () => {
      const fresh = await dispatch({ ...call, kind: "view", name: PLANNING_VIEW });
      const view = fresh.body.data as { jobs: PlanningJob[]; latest_requested_job_id: string | null };
      return fresh.status === 200 && view.latest_requested_job_id === material.jobId
        && view.jobs.some(job => job.job_id === material.jobId && job.status === "running");
    } });
    outcome = proposal.search.outcome === "no_feasible_plan"
      ? { ...authority, search: proposal.search, error_code: "NO_FEASIBLE_PLAN" }
      : { ...authority, proposal, search: proposal.search };
  } catch (error) {
    if (error instanceof PlanningSearchStopped && error.reason === "cancelled") return;
    const code = error instanceof PlanningSearchStopped ? "PLANNER_TIMEOUT" : error instanceof PlatformError
      && ["CONFIG_INCOMPLETE", "STATE_CONFLICT", "STALE_PROPOSAL", "SESSION_RESET", "SESSION_EXPIRED", "STORAGE_UNAVAILABLE"].includes(error.code)
      ? error.code : "STATE_CONFLICT";
    outcome = { ...authority, error_code: code };
  }
  try { await invoke(PLAN_COMPLETE, outcome); } catch { /* Durable lease watchdog resolves interrupted delivery; no operation is applied. */ }
}
