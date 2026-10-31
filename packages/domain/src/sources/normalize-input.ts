import { InputEventSchema } from "@floodops/contracts";
import type { Restriction, SourceFixture } from "@floodops/contracts";
import { fail } from "./source-types.ts";
import type { SourceEnvironment } from "./source-types.ts";
import { profileFor, sourceFor, validateFixtureBinding, validateRegistry } from "./source-policy.ts";
import { assertClock, assertMappedTime, normalizeMeasurement, simTimestamp } from "./source-time.ts";

/** A normalized envelope is evidence data, never a knowledge/reward/Execute transition. */
export function normalizeInput(raw: unknown, context: SourceEnvironment & { readonly restrictions: readonly Restriction[]; readonly sourceFixtures: readonly SourceFixture[] }) {
  validateRegistry(context); assertClock(context.t0, context.nowSimMinute);
  const parsed = InputEventSchema.safeParse(raw);
  if (!parsed.success) fail("INVALID_SCHEMA");
  const event = parsed.data, source = sourceFor(context, event.source_id);
  validateFixtureBinding(event, context.sourceFixtures);
  if (source.role !== event.role || source.provenance.label !== event.label) fail("SOURCE_ROLE_MISMATCH");
  assertMappedTime(context.t0, event.observed_at, event.sim_minute);
  if (event.sim_minute > context.nowSimMinute || Date.parse(event.received_at) < Date.parse(event.observed_at)
    || Date.parse(event.received_at) > Date.parse(simTimestamp(context.t0, context.nowSimMinute))) fail("INVALID_TIME");
  const measurement = event.measurement === null ? null : normalizeMeasurement(event.measurement);
  if (measurement && Date.parse(measurement.issued_at) > Date.parse(event.received_at)) fail("INVALID_TIME");
  if (measurement?.observed_at && Date.parse(measurement.observed_at) > Date.parse(event.received_at)) fail("INVALID_TIME");
  if (source.role === "context" && (event.restriction_id !== null || event.report_id !== null
    || measurement?.measurement_type === "street_depth")) fail("SOURCE_ROLE_MISMATCH");
  if (source.role === "observation" && event.restriction_id !== null) fail("SOURCE_ROLE_MISMATCH");
  if (source.role === "restriction") {
    const profile = profileFor(context, source);
    const restriction = context.restrictions.find(item => item.restriction_id === event.restriction_id);
    if (!profile.is_restriction_authority || !restriction || restriction.authority_profile_id !== profile.policy_profile_id
      || (restriction.kind === "reopening" && !profile.may_reopen_restriction)) fail("FORBIDDEN");
  }
  return { event: { ...event, measurement, observed_at: new Date(event.observed_at).toISOString(),
    received_at: new Date(event.received_at).toISOString() }, source: structuredClone(source),
    availability: source.access_status, warnings: measurement && ["tide_height", "river_level"].includes(measurement.measurement_type)
      && measurement.datum === null ? ["UNKNOWN_DATUM" as const] : [] };
}
