import { describe, expect, test } from "bun:test";
import { submitReport, proposeReportSubmission } from "@floodops/domain/reporting";
import { proposeObservationAcceptance, proposeConflictResolution, reconcileEvidence } from "@floodops/domain/knowledge";
import { driverContext, evidenceContext, observation, pair, participant, reportContext, reports } from "../sources/test-context.ts";

const acceptanceContext = () => ({ ...evidenceContext(), ...reportContext(), observationId: "obs_proposal1", reasonId: "manual-review" });
describe("actor-bound reporting and pure acceptance", () => {
  test("citizen normalization stays pending, separate from acceptance and award", () => {
    const context = reportContext(), before = structuredClone(context);
    const report = submitReport(reports().fresh, context);
    expect(report).toMatchObject({ status: "pending_review", participant_id: context.participant.participant_id,
      reporter_entity_id: context.participant.bound_entity_id, award_id: null, observation_ids: [], observation_candidates: [] });
    expect(context).toEqual(before);
  });
  test.each(["role", "confidence_band", "points", "accepted", "policy_profile_id", "knowledge_epoch"])("reject report-granted %s", field => {
    expect(() => submitReport({ ...reports().fresh, [field]: "admin" }, reportContext())).toThrow("INVALID_SCHEMA");
  });
  test("driver/contributor identity and vehicle scope come from server binding", () => {
    expect(() => submitReport({ ...reports().fresh, reporter_entity_id: "ent_someone1" }, reportContext())).toThrow("FORBIDDEN");
    expect(() => submitReport({ ...reports().fresh, vehicle_types: ["car"] }, reportContext())).toThrow("FORBIDDEN");
    expect(() => submitReport(reports().fresh, { ...reportContext(), participant: participant("driver") })).toThrow("FORBIDDEN");
    expect(() => submitReport(reports().fresh, { ...reportContext(), participant: participant("viewer") })).toThrow("FORBIDDEN");
    expect(() => submitReport(reports().fresh, { ...reportContext(), participant: { ...participant(), permissions: [] } })).toThrow("FORBIDDEN");
  });
  test("dispatcher explicit simulated selection preserves actual submitter", () => {
    const context = { ...reportContext(), participant: participant("dispatcher"), dispatcherEntities: [
      { entity_id: "ent_simulated1", kind: "citizen" as const, vehicle_types: ["motorbike" as const] }] };
    expect(() => submitReport(reports().fresh, context)).toThrow("FORBIDDEN");
    expect(() => submitReport({ ...reports().fresh, reporter_entity_id: "ent_missing1" }, context)).toThrow("FORBIDDEN");
    expect(submitReport({ ...reports().fresh, reporter_entity_id: "ent_simulated1" }, context)).toMatchObject({
      participant_id: context.participant.participant_id, reporter_entity_id: "ent_simulated1", status: "pending_review" });
  });
  test("quick driver path needs no model, text remains normalizing", () => {
    const context = driverContext(), quick = submitReport(reports().conflictingDriver, context);
    expect(quick.status).toBe("pending_review");
    expect(submitReport({ ...reports().conflictingDriver, input_mode: "text", quick_condition: null }, context).status).toBe("normalizing");
    expect(() => submitReport({ ...reports().conflictingDriver, quick_condition: null }, context)).toThrow("INVALID_SCHEMA");
    const output = proposeObservationAcceptance(quick, "impassable", context.epochs,
      { ...evidenceContext(), ...context, observationId: "obs_driver001", reasonId: "quick-deterministic" });
    expect(output.kind).toBe("proposed");
    expect(output.report.award_id).toBeNull();
    expect(output.observations.find(item => item.observation_id === "obs_driver001")).toMatchObject({
      confidence_band: "low", expires_sim_minute: 6, observed_sim_minute: 3 });
    expect(output.knowledge.find(item => item.segment_id === pair.segment_id && item.vehicle_type === "motorbike")?.state).toBe("unresolved_conflict");
  });
  test("expired/future/wrong-location reports retain explicit clarification reasons", () => {
    const context = reportContext();
    expect(submitReport(reports().expired, context)).toMatchObject({ status: "needs_clarification", reason_codes: ["EXPIRED"] });
    expect(submitReport({ ...reports().fresh, captured_at: "2026-10-31T00:04:00Z", captured_sim_minute: 4 }, context)).toMatchObject({ status: "needs_clarification", reason_codes: ["FUTURE_CAPTURE"] });
    expect(submitReport({ ...reports().fresh, coordinate: [106.702, 10.772] }, context).reason_codes).toContain("LOCATION_MISMATCH");
    expect(submitReport({ ...reports().fresh, vehicle_types: [] }, context).reason_codes).toContain("NEEDS_CLARIFICATION");
    expect(() => submitReport({ ...reports().fresh, captured_sim_minute: 2 }, context)).toThrow("INVALID_TIME");
  });
  test("unverified media waits, wrong/duplicate media cannot be accepted", () => {
    const input = { ...reports().fresh, fixture_photo_id: null, media_id: "med_photo001" };
    expect(submitReport(input, reportContext()).reason_codes).toContain("INVALID_IMAGE");
    const context = { ...reportContext(), media: { media_id: input.media_id, normalized: false, duplicate: false } };
    expect(submitReport(input, context).status).toBe("normalizing");
    expect(submitReport(input, { ...context, media: { ...context.media, normalized: true } }).status).toBe("pending_review");
    expect(submitReport(input, { ...context, media: { ...context.media, normalized: true, duplicate: true } }).reason_codes).toContain("DUPLICATE_IMAGE");
    expect(submitReport({ ...reports().fresh, fixture_photo_id: "photo_missing1" }, reportContext()).reason_codes).toContain("INVALID_IMAGE");
  });
  test("acceptance uses original capture TTL and preserves caller state; retries never award", () => {
    const context = acceptanceContext(), report = submitReport(reports().fresh, context), before = structuredClone(context);
    const output = proposeObservationAcceptance(report, "normal", context.epochs, context);
    expect(output).toMatchObject({ kind: "proposed", committed: false });
    expect(output.report).toMatchObject({ status: "accepted", award_id: null, observation_ids: [context.observationId] });
    expect(output.observations.find(item => item.observation_id === context.observationId)).toMatchObject({
      observed_sim_minute: 3, expires_sim_minute: 6, expires_at: "2026-10-31T00:06:00.000Z", confidence_band: "low" });
    expect(context).toEqual(before);
    const after = { ...context, observations: output.observations };
    expect(proposeObservationAcceptance(report, "normal", context.epochs, after).kind).toBe("redelivery");
    expect(proposeObservationAcceptance({ ...output.report, review_result_id: "review_manualfixture01", reviewed_at: context.receivedAt }, "normal", context.epochs, after).kind).toBe("redelivery");
    expect(() => proposeObservationAcceptance(report, "normal", context.epochs, { ...after, observationId: "obs_duplicate1" })).toThrow("INVALID_TRANSITION");
    expect(() => proposeObservationAcceptance(report, "normal", context.epochs, { ...context, nowSimMinute: 6 })).toThrow("INVALID_TRANSITION");
    expect(proposeObservationAcceptance(report, "normal", context.epochs, { ...context, inputRevision: 2 }).kind).toBe("proposed");
    expect(() => proposeObservationAcceptance(report, "normal", context.epochs, { ...context, inputRevision: 0 })).toThrow("INVALID_TRANSITION");
    expect(() => proposeObservationAcceptance({ ...report, reporter_entity_id: "ent_someone1" }, "normal", context.epochs, context)).toThrow("FORBIDDEN");
  });
  test("conflicting acceptance redelivery compares facts, not derived flags", () => {
    const context = acceptanceContext(), report = submitReport(reports().fresh, context);
    const first = proposeObservationAcceptance(report, "impassable", context.epochs, context);
    expect(first.observations.find(item => item.observation_id === context.observationId)?.has_conflict).toBe(true);
    const retry = proposeObservationAcceptance({ ...first.report, review_result_id: "review_manualfixture01", reviewed_at: context.receivedAt }, "impassable", context.epochs, { ...context, observations: first.observations });
    expect(retry.kind).toBe("redelivery");
    expect(retry.observations).toHaveLength(first.observations.length);
    expect(retry.report.award_id).toBeNull();
  });
  test("submission persists capture epochs without changing the wire report", () => {
    const context = reportContext(), submitted = proposeReportSubmission(reports().fresh, context);
    expect(submitted.capturedEpochs).toEqual([pair]);
    expect(submitted.committed).toBe(false);
    const acceptance = { ...acceptanceContext(), epochs: submitted.capturedEpochs };
    expect(() => proposeObservationAcceptance(submitted.report, "normal", context.epochs.map(item => item.segment_id === pair.segment_id ? { ...item, knowledge_epoch: 2 } : item), acceptance)).toThrow("STALE_EPOCH");
  });
  test("authoritative epoch cannot be supplied by a stale proposal", () => {
    const context = acceptanceContext(), report = submitReport(reports().fresh, context);
    expect(() => proposeObservationAcceptance(report, "normal", context.epochs.map(item => item.segment_id === pair.segment_id ? { ...item, knowledge_epoch: 0 } : item), context)).toThrow("STALE_EPOCH");
  });
  test("shared observation can conflict for bike while remaining known for car", () => {
    const context = evidenceContext(), normal = observation({ vehicle_types: ["motorbike", "car"] });
    const contrary = observation({ observation_id: "obs_bikeconf1", condition: "impassable" });
    const result = reconcileEvidence(reportContext().epochs, { ...context,
      observations: [...context.observations.filter(item => item.observation_id !== normal.observation_id), normal, contrary] });
    expect(result.knowledge.find(item => item.segment_id === pair.segment_id && item.vehicle_type === "motorbike")?.state).toBe("unresolved_conflict");
    expect(result.knowledge.find(item => item.segment_id === pair.segment_id && item.vehicle_type === "car")?.state).toBe("known");
    expect(result.observations.find(item => item.observation_id === normal.observation_id)?.has_conflict).toBe(true);
  });
  test("multi-vehicle resolution recomputes every affected projection", () => {
    const context = evidenceContext(), pairs = reportContext().epochs;
    const normal = observation({ vehicle_types: ["motorbike", "car"] });
    const contrary = observation({ observation_id: "obs_multicon1", condition: "impassable", vehicle_types: ["motorbike", "car"] });
    const next = { ...context, observations: [...context.observations.filter(item => item.observation_id !== normal.observation_id), normal, contrary] };
    const result = proposeConflictResolution({ pair, pairs, keepObservationIds: [normal.observation_id], supersedeObservationIds: [contrary.observation_id], reasonId: "review-both-scopes" }, next);
    expect(result.knowledge.filter(item => item.segment_id === pair.segment_id && ["motorbike", "car"].includes(item.vehicle_type)).map(item => item.state)).toEqual(["known", "known"]);
    expect(() => reconcileEvidence([pair], next)).toThrow("INVALID_TRANSITION");
  });
});
