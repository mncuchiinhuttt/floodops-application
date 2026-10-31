import { createHash } from "node:crypto";
import { ModelFailure } from "../../integrations/openai/responses-provider";
import type { PlanningJob } from "@floodops/contracts";
import type { Call, Reply, TransitionContext } from "../../shared/index";
import type { PlanningMaterial, ResolvedPlanningOptions } from "./runtime-types";
import { PLAN_BEGIN, PLAN_COMPLETE, PLANNING_VIEW } from "./runtime-types";
import { createToolSession } from "./tool-session";
import { runtimeRun } from "./runtime-context";
import { runCommander } from "./commander";
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
    const session = createToolSession(data.context, run, material.jobId, data.planId, options);
    const proposal = await runCommander(session, options, data.deadline, async () => {
      const fresh = await dispatch({ ...call, kind: "view", name: PLANNING_VIEW });
      const view = fresh.body.data as { jobs: PlanningJob[]; latest_requested_job_id: string | null };
      return fresh.status === 200 && view.latest_requested_job_id === material.jobId
        && view.jobs.some(job => job.job_id === material.jobId && job.status === "running");
    });
    outcome = { ...authority, proposal };
  } catch (error) { outcome = { ...authority, error_code: error instanceof ModelFailure ? error.code : "MODEL_INVALID_OUTPUT" }; }
  try { await invoke(PLAN_COMPLETE, outcome); } catch { /* Durable lease watchdog resolves interrupted delivery; no operation is applied. */ }
}
