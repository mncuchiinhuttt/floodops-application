import { formatEtag } from "@floodops/contracts";
import type { SimulationRun } from "@floodops/simulation";
import { planningKnowledge } from "./source-context";
import { fail } from "../../shared/index";
import type { TransitionContext } from "../../shared/index";
import type { PlanningRuntimeOptions } from "./runtime-types";
export function runtimeRun<State>(context: TransitionContext, options: PlanningRuntimeOptions<State>): SimulationRun {
  const run = options.persistence.read(context.snapshot.values), meta = context.snapshot.meta, ref = options.persistence.reference;
  if (meta.scenario_id !== ref.scenario_id || meta.scenario_version !== ref.scenario_version
    || run.scenario.bundleHash !== ref.bundle_hash || meta.horizon_minute !== run.scenario.manifest.config.horizon_minute
    || meta.sim_minute !== run.nowMs / 60000) fail(503, "CONFIG_INCOMPLETE");
  return normalizePlanningRun(run);
}
export interface CasInput<T = unknown> { input: T; etag: string | null }
export function casInput(value: unknown): CasInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(422, "INVALID_SCHEMA");
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some(key => key !== "input" && key !== "etag") || !("input" in v)
    || (v.etag !== null && typeof v.etag !== "string")) fail(422, "INVALID_SCHEMA");
  return { input: v.input, etag: v.etag as string | null };
}
export function metadataCas(context: TransitionContext, input: CasInput): void {
  if (!input.etag) fail(428, "PRECONDITION_REQUIRED", context.snapshot);
  if (input.etag !== formatEtag(context.snapshot.meta)) fail(412, "REVISION_MISMATCH", context.snapshot);
}
export function idle(context: TransitionContext): void {
  if (context.snapshot.meta.status === "advancing" || context.snapshot.pointers.active_advance_job_id) fail(409, "ADVANCE_IN_PROGRESS", context.snapshot);
}

/** Detached, producer-derived current evidence. Cached projections never outrank accepted facts. */
export function normalizePlanningRun(input: SimulationRun): SimulationRun {
  const run = structuredClone(input);
  try { run.knowledge = planningKnowledge(run).segments; } catch { fail(503, "CONFIG_INCOMPLETE"); }
  return run;
}
