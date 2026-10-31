import { ParameterSchema, SourceFixtureSchema, SourcePolicyProfileSchema, SourceSchema } from "@floodops/contracts";
import type { InputEvent, Source, SourceFixture } from "@floodops/contracts";
import { fail, uniqueIds } from "./source-types.ts";
import type { SourceRegistry } from "./source-types.ts";

/** Registry/config are server-frozen inputs, never fields copied from report/model text. */
export function validateRegistry(registry: SourceRegistry): void {
  for (const source of registry.sources) if (!SourceSchema.safeParse(source).success) fail("CONFIG_INCOMPLETE");
  for (const profile of registry.profiles) if (!SourcePolicyProfileSchema.safeParse(profile).success) fail("CONFIG_INCOMPLETE");
  for (const parameter of registry.parameters) if (!ParameterSchema.safeParse(parameter).success) fail("CONFIG_INCOMPLETE");
  uniqueIds(registry.sources.map(item => item.source_id));
  uniqueIds(registry.profiles.map(item => item.policy_profile_id));
  uniqueIds(registry.parameters.map(item => item.key));
  for (const source of registry.sources) if (source.policy_profile_id !== null
    && !registry.profiles.some(item => item.policy_profile_id === source.policy_profile_id)) fail("CONFIG_INCOMPLETE");
  for (const profile of registry.profiles) {
    const parameters = profile.parameter_keys.map(key => registry.parameters.find(item => item.key === key));
    if (parameters.some(item => !item || item.basis === "missing" || item.value === null)) fail("CONFIG_INCOMPLETE");
    for (const [value, unit] of [[profile.ttl_sim_minute, "minute"], [profile.location_tolerance_m, "m"]] as const) {
      if (value !== null && !parameters.some(item => item?.unit === unit && item.value === value)) fail("CONFIG_INCOMPLETE");
    }
    if (profile.may_reopen_restriction && !profile.is_restriction_authority) fail("CONFIG_INCOMPLETE");
  }
}
export function sourceFor(registry: SourceRegistry, sourceId: string, requireAvailable = true): Source {
  const source = registry.sources.find(item => item.source_id === sourceId);
  if (!source) fail("UNKNOWN_SOURCE");
  if (requireAvailable && source.access_status !== "available") fail("SOURCE_UNAVAILABLE");
  return source;
}
export function profileFor(registry: SourceRegistry, source: Source) {
  const profile = registry.profiles.find(item => item.policy_profile_id === source.policy_profile_id);
  if (!profile) fail("CONFIG_INCOMPLETE");
  return profile;
}

export function validateFixtureBinding(event: InputEvent, fixtures: readonly SourceFixture[]): void {
  uniqueIds(fixtures.map(item => item.fixture_event_id));
  if (fixtures.some(item => !SourceFixtureSchema.safeParse(item).success)) fail("CONFIG_INCOMPLETE");
  if (!fixtures.some(item => item.fixture_event_id === event.fixture_event_id && item.source_id === event.source_id
    && item.role === event.role)) fail("INVALID_SCHEMA");
}
