import { describe, expect, test } from "bun:test";
import { deriveCurrentKnowledge, deriveKnowledgeSnapshot, proposeConflictResolution } from "@floodops/domain/knowledge";
import { evidenceContext, observation, pair } from "../sources/test-context.ts";

describe("current knowledge", () => {
  test("capture and exact TTL boundaries, epoch and vehicles are independent", () => {
    const context = evidenceContext();
    expect(deriveCurrentKnowledge(pair, context)).toMatchObject({ state: "known", confidence_band: "low", expires_sim_minute: 6 });
    expect(deriveCurrentKnowledge(pair, { ...context, nowSimMinute: 2.999 })).toMatchObject({ state: "ordinary_unknown" });
    expect(deriveCurrentKnowledge(pair, { ...context, nowSimMinute: 5.999 })).toMatchObject({ state: "known" });
    expect(deriveCurrentKnowledge(pair, { ...context, nowSimMinute: 6 })).toMatchObject({ state: "ordinary_unknown", condition: "unknown" });
    expect(deriveCurrentKnowledge({ ...pair, knowledge_epoch: 2 }, context).state).toBe("ordinary_unknown");
    for (const vehicle_type of ["car", "truck"] as const) expect(deriveCurrentKnowledge({ ...pair, vehicle_type }, context).state).toBe("ordinary_unknown");
  });
  test("pending/rejected/superseded/future/unavailable evidence is never current", () => {
    for (const validation of ["pending", "rejected", "superseded"] as const) {
      const context = evidenceContext();
      expect(deriveCurrentKnowledge(pair, { ...context, observations: [observation({ validation })] }).state).toBe("ordinary_unknown");
    }
    const context = evidenceContext();
    expect(deriveCurrentKnowledge(pair, { ...context, sources: context.sources.map(item => item.source_id === "src_citizen1" ? { ...item, access_status: "unavailable" } : item) }).state).toBe("ordinary_unknown");
  });
  test("newer or high source cannot hide conflicting current conditions", () => {
    const context = evidenceContext(), contrary = observation({ observation_id: "obs_contrary1", source_id: "src_seedcam1",
      condition: "impassable", confidence_band: "high", observed_at: "2026-10-31T00:03:30Z", observed_sim_minute: 3.5,
      expires_at: "2026-10-31T00:20:00Z", expires_sim_minute: 20 });
    const result = deriveCurrentKnowledge(pair, { ...context, nowSimMinute: 4, observations: [...context.observations, contrary] });
    expect(result).toMatchObject({ state: "unresolved_conflict", condition: "unknown", confidence_band: null });
    expect(result.observation_ids).toEqual(["obs_bike001", "obs_contrary1"]);
  });
  test("no conflict selects high then latest then ID, with original expiry", () => {
    const context = evidenceContext(), high = observation({ observation_id: "obs_ahigh01", source_id: "src_seedcam1", confidence_band: "high",
      observed_at: "2026-10-31T00:02:00Z", observed_sim_minute: 2, expires_at: "2026-10-31T00:20:00Z", expires_sim_minute: 20 });
    const result = deriveCurrentKnowledge(pair, { ...context, observations: [...context.observations, high,
      { ...high, observation_id: "obs_zhigh01", expires_at: "2026-10-31T00:21:00Z", expires_sim_minute: 21 }] });
    expect(result).toMatchObject({ confidence_band: "high", expires_sim_minute: 20 });
    const newer = { ...high, observation_id: "obs_newest1", observed_at: "2026-10-31T00:02:30Z", observed_sim_minute: 2.5, expires_at: "2026-10-31T00:22:00Z", expires_sim_minute: 22 };
    expect(deriveCurrentKnowledge(pair, { ...context, observations: [...context.observations, high, newer] }).expires_sim_minute).toBe(22);
  });
  test("contrary photo never reopens closure, source outage never drops restriction", () => {
    const context = evidenceContext(), closedPair = { ...pair, segment_id: "seg_edge17" };
    const contrary = observation({ segment_id: closedPair.segment_id, observation_id: "obs_open001" });
    const result = deriveCurrentKnowledge(closedPair, { ...context, observations: [...context.observations, contrary],
      sources: context.sources.map(source => source.source_type === "authority" ? { ...source, access_status: "unavailable" } : source) });
    expect(result).toMatchObject({ state: "authoritative_closed", condition: "impassable", restriction_ids: ["rst_seg_edge17"] });
  });
  test("reopening is scoped, effective and configured, with exact closure reference", () => {
    const context = evidenceContext(), closure = context.restrictions[0]!;
    const reopening = { ...closure, restriction_id: "rst_reopen01", kind: "reopening" as const, vehicle_types: ["motorbike" as const],
      effective_sim_minute: 3, supersedes_restriction_id: closure.restriction_id };
    const input = { ...context.inputEvents[0]!, observed_at: "2026-10-31T00:03:00Z", received_at: "2026-10-31T00:03:00Z", input_event_id: "evt_reopen01", restriction_id: reopening.restriction_id, sim_minute: 3 };
    const next = { ...context, restrictions: [...context.restrictions, reopening], inputEvents: [...context.inputEvents, input] };
    expect(deriveCurrentKnowledge({ ...pair, segment_id: closure.segment_id }, next).state).toBe("ordinary_unknown");
    expect(deriveCurrentKnowledge({ ...pair, segment_id: closure.segment_id, vehicle_type: "car" }, next).state).toBe("authoritative_closed");
    expect(deriveCurrentKnowledge({ ...pair, segment_id: closure.segment_id }, { ...next, nowSimMinute: 2.99 }).state).toBe("authoritative_closed");
    expect(() => deriveCurrentKnowledge({ ...pair, segment_id: closure.segment_id }, { ...next, profiles: next.profiles.map(profile => ({ ...profile, may_reopen_restriction: false })) })).toThrow("FORBIDDEN");
    expect(() => deriveCurrentKnowledge(pair, { ...next, restrictions: [...context.restrictions, { ...reopening, supersedes_restriction_id: "rst_missing1" }] })).toThrow("FORBIDDEN");
  });
  test("restriction input cannot activate from mismapped or not-yet-received timestamps", () => {
    const context = evidenceContext(), closure = context.restrictions[0]!;
    const reopening = { ...closure, restriction_id: "rst_timeopen1", kind: "reopening" as const,
      effective_sim_minute: 3, supersedes_restriction_id: closure.restriction_id };
    const input = { ...context.inputEvents[0]!, input_event_id: "evt_timeopen1", restriction_id: reopening.restriction_id,
      observed_at: "2026-10-31T00:04:00Z", received_at: "2026-10-31T00:04:00Z", sim_minute: 3 };
    const next = { ...context, restrictions: [...context.restrictions, reopening], inputEvents: [...context.inputEvents, input] };
    expect(() => deriveCurrentKnowledge({ ...pair, segment_id: closure.segment_id }, next)).toThrow("INVALID_TIME");
    const laterReceipt = { ...input, observed_at: "2026-10-31T00:03:00Z" };
    expect(deriveCurrentKnowledge({ ...pair, segment_id: closure.segment_id }, { ...next, inputEvents: [...context.inputEvents, laterReceipt] }).state).toBe("authoritative_closed");
  });
  test("explicit conflict resolution supersedes exact evidence without committing", () => {
    const context = evidenceContext(), contradictory = observation({ observation_id: "obs_contrary1", condition: "impassable" });
    const withConflict = { ...context, observations: [...context.observations, contradictory] }, before = structuredClone(withConflict);
    const result = proposeConflictResolution({ pair, pairs: context.graph.segments.flatMap(edge => edge.allowed_vehicle_types.map(vehicle_type => ({ segment_id: edge.segment_id, vehicle_type, knowledge_epoch: edge.segment_id === pair.segment_id ? 1 : 0 }))), keepObservationIds: ["obs_bike001"], supersedeObservationIds: ["obs_contrary1"], reasonId: "manual-reviewed" }, withConflict);
    expect(result.committed).toBe(false);
    expect(result.resolvedKnowledge).toMatchObject({ state: "known", condition: "normal", confidence_band: "low" });
    expect(result.observations.find(item => item.observation_id === contradictory.observation_id)?.validation).toBe("superseded");
    expect(withConflict).toEqual(before);
    expect(() => proposeConflictResolution({ pair, pairs: context.graph.segments.flatMap(edge => edge.allowed_vehicle_types.map(vehicle_type => ({ segment_id: edge.segment_id, vehicle_type, knowledge_epoch: edge.segment_id === pair.segment_id ? 1 : 0 }))), keepObservationIds: ["obs_bike001"], supersedeObservationIds: [], reasonId: "review" }, withConflict)).toThrow("INVALID_TRANSITION");
    expect(() => proposeConflictResolution({ pair, pairs: context.graph.segments.flatMap(edge => edge.allowed_vehicle_types.map(vehicle_type => ({ segment_id: edge.segment_id, vehicle_type, knowledge_epoch: edge.segment_id === pair.segment_id ? 1 : 0 }))), keepObservationIds: ["obs_bike001"], supersedeObservationIds: ["obs_contrary1"], reasonId: "" }, withConflict)).toThrow("INVALID_TRANSITION");
  });
  test("invalid TTL/confidence/duplicate pairs never become trusted knowledge", () => {
    const context = evidenceContext();
    expect(() => deriveCurrentKnowledge(pair, { ...context, observations: [observation({ confidence_band: "high" })] })).toThrow("CONFIG_INCOMPLETE");
    expect(() => deriveKnowledgeSnapshot([pair, pair], context)).toThrow("INVALID_SCHEMA");
    expect(deriveCurrentKnowledge(pair, { ...context, observations: [observation({ condition: "unknown" })] }).state).toBe("ordinary_unknown");
  });
});
