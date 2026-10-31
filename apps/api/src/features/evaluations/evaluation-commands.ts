import { parseSchema } from "@floodops/contracts";
import { aggregateEvaluation } from "./pure/index";
import { fail } from "../../shared/index";
import type { ReducerDefinition, RuntimeRegistry } from "../../shared/index";
import { assertPlanningIdle, runtimeRun } from "../planning/index";
import { evaluationValues, readEvaluationState } from "./evaluation-state";
import { EVAL_BEGIN, EVAL_COMPLETE, EVAL_START, EVAL_VIEW, EVALUATION_TRIALS } from "./runtime-types";
import type { EvaluationOptions } from "./runtime-types";

function exact(raw: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).some(key => !keys.includes(key))
    || keys.some(key => !(key in raw))) fail(422, "INVALID_SCHEMA");
  return Object.fromEntries(Object.entries(raw));
}
const text = (value: unknown) => { if (typeof value !== "string" || !value) fail(422, "INVALID_SCHEMA"); return value; };
const audience = { audience: ["dispatcher" as const] };

export function evaluationRegistry<State>(options: EvaluationOptions<State>): RuntimeRegistry {
  const start: ReducerDefinition = { permission: "evaluation:run", operational: false,
    validate: raw => parseSchema("EvaluationInput", raw), reduce(context, raw) {
      const input = parseSchema("EvaluationInput", raw), { snapshot, now } = context, meta = snapshot.meta;
      if (input.scenario_id !== meta.scenario_id || input.scenario_version !== meta.scenario_version) fail(422, "UNKNOWN_ENTITY");
      assertPlanningIdle(context); runtimeRun(context, options);
      const state = readEvaluationState(snapshot, now);
      if (Object.values(state.runs).some(record => ["queued", "running"].includes(record.run.status))) fail(409, "STATE_CONFLICT", snapshot);
      const run = parseSchema("EvaluationRun", { evaluation_id: "evaluation_" + crypto.randomUUID(), status: "queued", kind: input.kind,
        trials: [], valid_first_proposals: 0, p95_ms: null, is_real_model: false });
      state.runs[run.evaluation_id] = { run, inputRevision: meta.revision, attemptId: null, createdMs: now };
      return { data: run, values: evaluationValues(snapshot, state), events: [{ type: "state_changed", ...audience }] };
    } };
  const begin: ReducerDefinition = { permission: "evaluation:run", operational: false,
    validate: raw => exact(raw, ["evaluation_id", "attempt_id"]), reduce(context, raw) {
      const input = exact(raw, ["evaluation_id", "attempt_id"]), state = readEvaluationState(context.snapshot, context.now);
      const record = state.runs[parseSchema("Id", input.evaluation_id)];
      if (!record) fail(404, "NOT_FOUND");
      if (record.attemptId || record.run.status !== "queued") return { data: { claimed: false }, events: [] };
      if (record.inputRevision !== context.snapshot.meta.revision) fail(412, "REVISION_MISMATCH", context.snapshot);
      record.attemptId = parseSchema("Id", input.attempt_id); record.run = { ...record.run, status: "running" };
      return { data: { claimed: true, context }, values: evaluationValues(context.snapshot, state), events: [{ type: "state_changed", ...audience }] };
    } };
  const keys = ["evaluation_id", "attempt_id", "outcome", "planner_config_hash", "trials"] as const;
  const complete: ReducerDefinition = { permission: "evaluation:run", operational: false,
    validate: raw => exact(raw, keys), reduce(context, raw) {
      const input = exact(raw, keys), state = readEvaluationState(context.snapshot, context.now);
      const record = state.runs[parseSchema("Id", input.evaluation_id)];
      if (!record) fail(404, "NOT_FOUND");
      if (record.attemptId !== input.attempt_id || record.run.status !== "running") fail(409, "STATE_CONFLICT", context.snapshot);
      if (!["completed", "failed"].includes(String(input.outcome)) || !Array.isArray(input.trials) || input.trials.length !== EVALUATION_TRIALS
        || input.planner_config_hash !== options.planner.config_hash) fail(422, "INVALID_SCHEMA");
      const status = input.outcome === "failed" ? "failed" as const : "completed" as const;
      let aggregated;
      try {
        aggregated = aggregateEvaluation({ evaluationId: record.run.evaluation_id, kind: record.run.kind, isRealModel: false,
          plannerConfigHash: text(input.planner_config_hash), trials: input.trials.map(trial => parseSchema("EvaluationTrial", trial)) });
      } catch { fail(422, "INVALID_SCHEMA"); }
      record.run = { ...aggregated, status };
      return { data: record.run, values: evaluationValues(context.snapshot, state), events: [{ type: "state_changed", ...audience }] };
    } };
  return { commands: { [EVAL_START]: start, [EVAL_BEGIN]: begin, [EVAL_COMPLETE]: complete },
    views: { [EVAL_VIEW]: { permission: "evaluation:run", roles: ["dispatcher"],
      project: context => Object.values(readEvaluationState(context.snapshot, context.now).runs).map(record => record.run) } } };
}
