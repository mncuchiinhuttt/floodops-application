import { parseSchema } from "@floodops/contracts";
import { fail } from "../shared/platform-error";
import type { RuntimeRegistry, SessionSeed, Snapshot } from "../shared/platform-types";
/** The immutable creation seed is authority; mutable values cannot upgrade an old session. */
export function matchesSerialization(seed: SessionSeed, registry: RuntimeRegistry): boolean {
  if (registry.serialization === undefined) return true;
  const marker = seed.values?.runtime_contract;
  return typeof registry.serialization === "string" && registry.serialization.length > 0 && !!marker &&
    typeof marker === "object" && !Array.isArray(marker) && (marker as Record<string, unknown>).serialization === registry.serialization;
}
export function requireSerialization(snapshot: Snapshot, registry: RuntimeRegistry): void {
  if (!matchesSerialization(snapshot.seed, registry)) fail(503, "CONFIG_INCOMPLETE", snapshot);
}
export function seedForReset(snapshot: Snapshot, registry: RuntimeRegistry): SessionSeed {
  const previous = snapshot.seed;
  const seed = registry.seedForReset ? registry.seedForReset(structuredClone(previous)) : structuredClone(previous);
  if (!seed || typeof seed !== "object" || typeof (seed as unknown as { then?: unknown }).then === "function" ||
    seed.scenario_id !== previous.scenario_id || seed.scenario_version !== previous.scenario_version ||
    seed.horizon_minute !== previous.horizon_minute || seed.calibration_status !== previous.calibration_status || !seed.values || typeof seed.values !== "object" || Array.isArray(seed.values) ||
    !seed.entities || !Array.isArray(seed.entities.driver) || !Array.isArray(seed.entities.contributor) || !matchesSerialization(seed, registry)) fail(503, "CONFIG_INCOMPLETE", snapshot);
  parseSchema("Id", seed.scenario_id); seed.entities.driver.forEach(id => parseSchema("Id", id)); seed.entities.contributor.forEach(id => parseSchema("Id", id));
  parseSchema("SessionMeta", { ...snapshot.meta, calibration_status: seed.calibration_status, horizon_minute: seed.horizon_minute });
  return structuredClone(seed);
}
