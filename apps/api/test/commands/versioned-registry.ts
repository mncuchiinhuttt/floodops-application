import type { RuntimeRegistry, SessionSeed } from "../../src/shared/platform-types";
export function versionedSeed(base: SessionSeed): SessionSeed {
  return { ...structuredClone(base), scenario_id: "scenario_versioned01", values: {
    ...(base.values.test_reset_fail_once ? { test_reset_fail_once: true } : {}),
    counter: 0, report: { pending: true, digest: "a".repeat(64) }, test_serialization_registry: true,
    runtime_contract: { serialization: "m1-v1", version: "0.5.0-m1" },
  } };
}
export function versionedRegistry(base: RuntimeRegistry, initial: SessionSeed): RuntimeRegistry {
  const mode = initial.values.test_reset_seed_mode;
  const fresh = versionedSeed(initial);
  return { ...base, serialization: "m1-v1", seedForReset: mode === "no-resolver" ? undefined : () => {
    if (mode === "wrong-scenario") return { ...fresh, scenario_id: "scenario_wrong01" };
    if (mode === "missing-marker") return { ...fresh, values: {} };
    if (mode === "async") return Promise.resolve(fresh) as unknown as SessionSeed;
    if (mode === "throws") throw new Error("Synthetic reset seed factory failure");
    return fresh;
  } };
}
