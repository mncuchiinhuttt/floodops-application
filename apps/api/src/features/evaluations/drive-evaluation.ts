import { createHash } from "node:crypto";
import { parseSchema } from "@floodops/contracts";
import type { EvaluationRun, EvaluationTrial } from "@floodops/contracts";
import { PlatformError } from "../../shared/index";
import type { Call, Reply, TransitionContext } from "../../shared/index";
import { PlanningSearchStopped, runDeterministicPlanner } from "../planning/index";
import { EVAL_BEGIN, EVAL_COMPLETE, EVAL_VIEW, EVALUATION_TRIALS, TRIAL_DEADLINE_MS } from "./runtime-types";
import type { EvaluationOptions } from "./runtime-types";

export type EvaluationDispatch = (call: Call) => Promise<Reply>;
type TrialError = NonNullable<EvaluationTrial["error_code"]>;
const hex = (value: string) => createHash("sha256").update(value).digest("hex");
const PLATFORM_CODES: readonly string[] = ["CONFIG_INCOMPLETE", "STATE_CONFLICT", "STALE_PROPOSAL", "SESSION_RESET", "SESSION_EXPIRED", "STORAGE_UNAVAILABLE"];

function claimedContext(data: unknown): TransitionContext | null {
  if (!data || typeof data !== "object" || !("claimed" in data) || data.claimed !== true || !("context" in data)) return null;
  const context = data.context;
  return context && typeof context === "object" && "snapshot" in context && "actor" in context ? context as TransitionContext : null;
}
/**
 * Session Durable Object runner, mirroring planning's drive: claim once, replay the committed deterministic planner against
 * the captured snapshot ten times, then persist the aggregate. Nothing here mutates the interactive session
 * and no provider/model is called, so a result is never a real-model claim.
 */
export async function driveEvaluation<State>(dispatch: EvaluationDispatch, call: Call, reply: Reply, options: EvaluationOptions<State>): Promise<void> {
  if (reply.status !== 200) return;
  const queued: EvaluationRun = parseSchema("EvaluationRun", reply.body.data), attemptId = "attempt_" + crypto.randomUUID();
  const authority = { evaluation_id: queued.evaluation_id, attempt_id: attemptId };
  const send = (name: string, payload: unknown) => dispatch({ ...call, kind: "command", name, key: "eval_" + hex(name + attemptId),
    path: "/internal/evaluations/" + queued.evaluation_id, payload });
  let context: TransitionContext | null;
  try { context = claimedContext((await send(EVAL_BEGIN, authority)).body.data); } catch { return; }
  if (!context) return;
  const revision = context.snapshot.meta.revision, trials: EvaluationTrial[] = [];
  const base = { planner_config_hash: options.planner.config_hash };
  const current = async () => {
    const fresh = await dispatch({ ...call, kind: "view", name: EVAL_VIEW });
    if (fresh.status !== 200 || fresh.body.meta.revision !== revision || !Array.isArray(fresh.body.data)) return false;
    return fresh.body.data.some(run => run?.evaluation_id === queued.evaluation_id && run.status === "running");
  };
  const failedTrial = (trial: number, error_code: TrialError, latency_ms: number | null): EvaluationTrial =>
    ({ trial, first_proposal_valid: false, latency_ms, failed: true, error_code, plan_id: null, ...base });
  let lostFence = false;
  try {
    const run = options.persistence.read(context.snapshot.values);
    for (let trial = 1; trial <= EVALUATION_TRIALS; trial++) {
      if (lostFence) { trials.push(failedTrial(trial, "STATE_CONFLICT", null)); continue; }
      const stamp = hex(queued.evaluation_id + trial), started = Date.now();
      // Trial latency is measured wall clock (including state-fence round trips) only for the rehearsal kind.
      const latency = () => queued.kind === "latency_rehearsal" ? Math.max(0, Date.now() - started) : null;
      try {
        const proposal = await runDeterministicPlanner(context, run, "job_eval" + stamp.slice(0, 32), "plan_eval" + stamp.slice(32, 64),
          { persistence: options.persistence }, options.limits, { deadline: started + TRIAL_DEADLINE_MS, current });
        const outcome = proposal.search.outcome, ready = ["ready", "pending_approval"].includes(proposal.plan.status);
        trials.push(outcome === "no_feasible_plan" ? failedTrial(trial, "NO_FEASIBLE_PLAN", latency())
          : { trial, first_proposal_valid: outcome === "candidate" && ready, latency_ms: latency(), failed: false, error_code: null,
            plan_id: outcome === "candidate" ? proposal.plan.plan_id : null, ...base });
      } catch (error) {
        if (error instanceof PlanningSearchStopped && error.reason === "cancelled") lostFence = true;
        const code = error instanceof PlanningSearchStopped ? error.reason === "deadline" ? "PLANNER_TIMEOUT" : "STATE_CONFLICT"
          : error instanceof PlatformError && PLATFORM_CODES.includes(error.code) ? error.code as TrialError : "STATE_CONFLICT";
        trials.push(failedTrial(trial, code, latency()));
      }
    }
  } catch { while (trials.length < EVALUATION_TRIALS) trials.push(failedTrial(trials.length + 1, "STATE_CONFLICT", null)); lostFence = true; }
  try { await send(EVAL_COMPLETE, { ...authority, outcome: lostFence ? "failed" : "completed", planner_config_hash: options.planner.config_hash, trials }); }
  catch { /* The record expires to failed at its deadline; no trial is invented. */ }
}
