import { ObservationSchema, RestrictionSchema, InputEventSchema } from "@floodops/contracts";
import type { Observation, Restriction, VehicleType } from "@floodops/contracts";
import { fail, uniqueIds } from "../sources/source-types.ts";
import type { EvidenceContext } from "../sources/source-types.ts";
import { profileFor, sourceFor, validateFixtureBinding } from "../sources/source-policy.ts";
import { assertMappedTime, simTimestamp } from "../sources/source-time.ts";

export interface KnowledgePair { readonly segment_id: string; readonly vehicle_type: VehicleType; readonly knowledge_epoch: number }
export function currentEvidence(pair: KnowledgePair, context: EvidenceContext): Observation[] {
  uniqueIds(context.observations.map(item => item.observation_id));
  return context.observations.filter(raw => {
    const parsed = ObservationSchema.safeParse(raw);
    if (!parsed.success) fail("INVALID_SCHEMA");
    const item = parsed.data, source = sourceFor(context, item.source_id, false);
    if (source.role !== "observation") fail("SOURCE_ROLE_MISMATCH");
    const profile = profileFor(context, source);
    assertMappedTime(context.t0, item.observed_at, item.observed_sim_minute);
    assertMappedTime(context.t0, item.expires_at, item.expires_sim_minute);
    if (profile.ttl_sim_minute === null || item.confidence_band !== profile.confidence_band
      || item.expires_sim_minute <= item.observed_sim_minute
      || item.expires_sim_minute - item.observed_sim_minute > profile.ttl_sim_minute) fail("CONFIG_INCOMPLETE");
    const edge = context.graph.segments.find(edge => edge.segment_id === item.segment_id);
    if (!edge || item.vehicle_types.some(vehicle => !edge.allowed_vehicle_types.includes(vehicle))) fail("UNKNOWN_SEGMENT");
    return source.access_status === "available" && item.validation === "accepted" && item.segment_id === pair.segment_id
      && item.vehicle_types.includes(pair.vehicle_type) && item.knowledge_epoch === pair.knowledge_epoch
      && item.observed_sim_minute <= context.nowSimMinute && context.nowSimMinute < item.expires_sim_minute;
  });
}
export function activeClosures(pair: KnowledgePair, context: EvidenceContext): Restriction[] {
  uniqueIds(context.restrictions.map(item => item.restriction_id));
  uniqueIds(context.inputEvents.map(item => item.input_event_id));
  for (const input of context.inputEvents) {
    if (!InputEventSchema.safeParse(input).success) fail("INVALID_SCHEMA");
    validateFixtureBinding(input, context.sourceFixtures);
    assertMappedTime(context.t0, input.observed_at, input.sim_minute);
    if (Date.parse(input.received_at) < Date.parse(input.observed_at)) fail("INVALID_TIME");
    const source = sourceFor(context, input.source_id, false);
    if (input.role !== source.role) fail("SOURCE_ROLE_MISMATCH");
    if (input.restriction_id !== null && (!context.restrictions.some(item => item.restriction_id === input.restriction_id
      && item.authority_profile_id === source.policy_profile_id) || source.role !== "restriction")) fail("FORBIDDEN");
  }
  for (const item of context.restrictions) {
    if (!RestrictionSchema.safeParse(item).success) fail("INVALID_SCHEMA");
    const profile = context.profiles.find(profile => profile.policy_profile_id === item.authority_profile_id);
    if (!profile?.is_restriction_authority) fail("FORBIDDEN");
    const edge = context.graph.segments.find(edge => edge.segment_id === item.segment_id);
    if (!edge || item.vehicle_types.some(vehicle => !edge.allowed_vehicle_types.includes(vehicle))) fail("UNKNOWN_SEGMENT");
    if (item.kind === "reopening" && (!profile.may_reopen_restriction || !context.restrictions.some(closure =>
      closure.restriction_id === item.supersedes_restriction_id && closure.kind === "closure" && closure.segment_id === item.segment_id
      && closure.effective_sim_minute <= item.effective_sim_minute && item.vehicle_types.every(vehicle => closure.vehicle_types.includes(vehicle))))) fail("FORBIDDEN");
  }
  const effective = context.restrictions.filter(item => item.segment_id === pair.segment_id && item.vehicle_types.includes(pair.vehicle_type)
    && item.effective_sim_minute <= context.nowSimMinute && context.inputEvents.some(input => input.role === "restriction"
      && input.restriction_id === item.restriction_id && input.sim_minute <= context.nowSimMinute
      && Date.parse(input.received_at) <= Date.parse(simTimestamp(context.t0, context.nowSimMinute))));
  return effective.filter(item => item.kind === "closure" && !effective.some(reopen => reopen.kind === "reopening"
    && reopen.supersedes_restriction_id === item.restriction_id));
}
