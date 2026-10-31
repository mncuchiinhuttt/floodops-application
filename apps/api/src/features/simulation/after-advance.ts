import { canonicalJson } from "@floodops/simulation";
import { freezeValue } from "@floodops/domain/operations";
import { fail } from "../../shared/index";
import type { AfterAdvanceInput, ResolvedOptions } from "./runtime-types";

export function reconcileAfterAdvance<State>(options: ResolvedOptions<State>, proposed: AfterAdvanceInput): Record<string, unknown> {
  if (!options.afterAdvance) return proposed.values;
  const input = freezeValue(structuredClone(proposed));
  const values = options.afterAdvance(input);
  if (!values || typeof values !== "object" || Array.isArray(values) || typeof (values as { then?: unknown }).then === "function") fail(503, "CONFIG_INCOMPLETE");
  for (const key of Object.keys(proposed.values)) {
    if (!Object.hasOwn(values, key) || values[key] === undefined || (proposed.values[key] !== null && values[key] === null)) fail(503, "CONFIG_INCOMPLETE");
  }
  for (const key of ["simulation", "simulation_advances", "runtime_contract"]) {
    if (Object.hasOwn(proposed.values, key) && canonicalJson(values[key]) !== canonicalJson(proposed.values[key])) fail(503, "CONFIG_INCOMPLETE");
  }
  return values;
}
