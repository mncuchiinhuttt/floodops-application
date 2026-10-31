import { expect, test } from "bun:test";
import {
  createRewardLedger, deriveUsefulCoverage, proposeGapOpenings, proposeReportReward, proposeSourceGapFills, validateLedger, RewardProposalError,
} from "../../../../packages/domain/src/rewards/index.ts";
import { bike, car, context, coverage, hashB, known, lowObservation, openedLedger, report, rewardInput, source, unknownKnowledge } from "./fixtures.ts";

test("unresolved conflict remains open; later accepted resolution can fill/award once with same stored photo", () => {
  const conflictObservation = { ...lowObservation, has_conflict: true }, conflict = coverage({ observations: [conflictObservation],
    knowledge: [{ ...known(conflictObservation), state: "unresolved_conflict" }, unknownKnowledge(car)] });
  const input = rewardInput({ after: conflict }), first = proposeReportReward(openedLedger(), input);
  expect(first.reason).toBe("CONFLICT"); expect(first.filled_gap_ids).toEqual([]); expect(first.ledger.awards).toEqual([]);
  expect(first.ledger.gaps.every(gap => gap.status === "open")).toBeTrue(); expect(first.ledger.photos).toHaveLength(1);
  const resolved = proposeReportReward(first.ledger, rewardInput({ before: conflict, context: { ...context, event_sequence: 3 } }));
  expect(resolved.reason).toBe("AWARDED"); expect(resolved.ledger.awards).toHaveLength(1); expect(resolved.ledger.photos).toHaveLength(1);
  expect(proposeReportReward(resolved.ledger, rewardInput({ before: conflict, context: { ...context, event_sequence: 3 } })).new_award).toBeNull();
});
test("authoritative closure, wrong epoch and future/expired evidence never fill gap despite acceptance", () => {
  const input = rewardInput();
  const invalid = [
    { ...input.after, knowledge: [{ ...known(lowObservation), state: "authoritative_closed" as const, restriction_ids: ["rst_closed01"] }] },
    { ...input.after, knowledge: [{ ...known(lowObservation), knowledge_epoch: 0 }] },
    { ...input.after, observations: [{ ...lowObservation, observed_sim_minute: 4 }] },
    { ...input.after, observations: [{ ...lowObservation, expires_sim_minute: 3 }] },
    { ...input.after, knowledge: [{ ...known(lowObservation), state: "unresolved_conflict" as const }] },
  ];
  for (const after of invalid) {
    const original = structuredClone(after), result = proposeReportReward(openedLedger(), { ...input, after });
    expect(result.filled_gap_ids).toEqual([]); expect(result.new_award).toBeNull(); expect(after).toEqual(original);
  }
});
test("expiry opens a fresh gap, retains old points, forbids old report reaward and permits a new contributor/photo", () => {
  const first = proposeReportReward(openedLedger(), rewardInput());
  const expired = coverage({ now_sim_minute: 6, observations: [lowObservation], knowledge: [known(lowObservation), unknownKnowledge(car)] });
  const reopened = proposeGapOpenings(first.ledger, expired, { ...context, event_sequence: 3 }, [{ ...bike, gap_id: "gap_bike002" }]);
  expect(reopened.gaps).toHaveLength(3); expect(reopened.awards).toEqual(first.ledger.awards); expect(reopened.photos).toEqual(first.ledger.photos);
  const old = proposeReportReward(reopened, rewardInput({ before: expired, after: expired, context: { ...context, event_sequence: 4 } }));
  expect(old.new_award).toBeNull(); expect(old.ledger.gaps.find(gap => gap.gap_id === "gap_bike002")?.status).toBe("open");
  const observation = { ...lowObservation, observation_id: "obs_new0001", observed_sim_minute: 6, expires_sim_minute: 9,
    observed_at: "2026-10-31T00:06:00Z", expires_at: "2026-10-31T00:09:00Z", evidence_ids: ["rpt_new0001"] };
  const newInput = rewardInput({ before: expired, after: coverage({ now_sim_minute: 6, observations: [observation], knowledge: [known(observation), unknownKnowledge(car)] }),
    report: report({ report_id: "rpt_new0001", reporter_entity_id: "con_person002", captured_sim_minute: 6, captured_at: observation.observed_at, observation_ids: [observation.observation_id] }),
    photo: { report_id: "rpt_new0001", normalized_hash: hashB, ready: true },
    context: { ...context, event_sequence: 4, award_id: "awd_reward002", awarded_at: observation.observed_at } });
  const second = proposeReportReward(reopened, newInput);
  expect(second.new_award?.filled_gap_ids).toEqual(["gap_bike002"]); expect(second.ledger.awards).toHaveLength(2);
  expect(second.ledger.awards.reduce((sum, award) => sum + award.points, 0)).toBe(14);
  expect(reopened.awards).toHaveLength(1); expect(first.ledger.gaps).toHaveLength(2);
});
test("Reset seeds an empty separate generation; old contexts cannot alter new ledger", () => {
  const first = proposeReportReward(openedLedger(), rewardInput());
  const reset = createRewardLedger(context.session_id, 2, 0);
  expect(reset).toMatchObject({ generation: 2, gaps: [], photos: [], awards: [] }); expect(first.ledger.awards).toHaveLength(1);
  expect(() => proposeReportReward(reset, rewardInput())).toThrow(RewardProposalError);
});
test("camera recovery fills without report or award; expiry opens a new occurrence and never awards camera", () => {
  const before = coverage(), cameraSource = { ...source, source_type: "camera" as const };
  const after = coverage({ observations: [lowObservation], sources: [cameraSource], knowledge: [known(lowObservation), unknownKnowledge(car)] });
  const result = proposeSourceGapFills(openedLedger(), before, after, context);
  expect(result.gaps.find(gap => gap.vehicle_type === "motorbike")).toMatchObject({ status: "filled", filled_by_report_id: null, first_award_id: null });
  expect(result.awards).toEqual([]); expect(result.photos).toEqual([]);
  const expired = { ...after, now_sim_minute: 6 };
  const reopened = proposeGapOpenings(result, expired, { ...context, event_sequence: 3 }, [{ ...bike, gap_id: "gap_bike002" }]);
  expect(reopened.gaps.filter(gap => gap.vehicle_type === "motorbike").map(gap => gap.status)).toEqual(["filled", "open"]);
  expect(reopened.awards).toEqual([]);
  expect(proposeSourceGapFills(openedLedger(), before, rewardInput().after, context)).toEqual(openedLedger());
});
test("history rejects duplicate first-fill/report/IDs and award without matching normalized photo claim", () => {
  const ledger = proposeReportReward(openedLedger(), rewardInput()).ledger;
  const invalid = [
    { ...ledger, photos: [] },
    ...[2, 3].map(opened_sequence => ({ ...ledger, last_event_sequence: 3,
      gaps: ledger.gaps.map(gap => gap.first_award_id ? { ...gap, opened_sequence } : gap) })), { ...ledger, photos: [{ ...ledger.photos[0]!, contributor_id: "con_other001" }] },
    { ...ledger, awards: [ledger.awards[0]!, { ...ledger.awards[0]!, award_id: "awd_other001" }] },
    { ...ledger, gaps: [...ledger.gaps, ledger.gaps[0]!] },
    { ...ledger, gaps: ledger.gaps.map(gap => gap.vehicle_type === "motorbike" ? { ...gap, first_award_id: null } : gap) },
    { ...ledger, photos: [ledger.photos[0]!, { ...ledger.photos[0]!, report_id: "rpt_other001" }] },
  ];
  for (const value of invalid) expect(() => validateLedger(value)).toThrow(RewardProposalError);
  const input = rewardInput({ photo: { report_id: "rpt_bike001", normalized_hash: hashB, ready: true }, context: { ...context, event_sequence: 3 } });
  expect(() => proposeReportReward(ledger, input)).toThrow(RewardProposalError);
});
test("no hidden observation-to-road permission conversion", () => {
  const result = deriveUsefulCoverage(rewardInput().after);
  expect(result.coverage.covered_pairs).toBe(1); expect(result).not.toHaveProperty("approved");
  expect(result).not.toHaveProperty("execute"); expect(lowObservation.confidence_band).toBe("low");
});

test("a report with one unresolved vehicle pair cannot fill or earn on another clean pair", () => {
  const conflictingCar = { ...lowObservation, observation_id: "obs_car0001", vehicle_types: ["car"] as ("car")[], has_conflict: true };
  const after = coverage({ observations: [lowObservation, conflictingCar], knowledge: [known(lowObservation),
    { ...known(conflictingCar), state: "unresolved_conflict" }] });
  const input = rewardInput({ after, report: report({ vehicle_types: ["motorbike", "car"],
    observation_ids: [lowObservation.observation_id, conflictingCar.observation_id] }) });
  const result = proposeReportReward(openedLedger(), input);
  expect(result.reason).toBe("CONFLICT"); expect(result.new_award).toBeNull(); expect(result.filled_gap_ids).toEqual([]);
  expect(result.ledger.gaps.every(gap => gap.status === "open")).toBeTrue(); expect(result.ledger.photos).toHaveLength(1);
});
test("superseded conflicting history cannot block a resolved current report", () => {
  const history = { ...lowObservation, observation_id: "obs_history1", has_conflict: true, validation: "superseded" as const };
  const input = rewardInput({ after: coverage({ observations: [lowObservation, history], knowledge: [known(lowObservation), unknownKnowledge(car)] }),
    report: report({ observation_ids: [lowObservation.observation_id, history.observation_id] }) });
  const result = proposeReportReward(openedLedger(), input);
  expect(result.reason).toBe("AWARDED"); expect(result.new_award?.points).toBe(7);
});

test("a report conflict outside reward-relevant pairs still blocks the entire report reward", () => {
  const truck = { ...lowObservation, observation_id: "obs_truck001", vehicle_types: ["truck"] as ("truck")[], has_conflict: true };
  const input = rewardInput({ after: coverage({ observations: [lowObservation, truck], knowledge: [known(lowObservation),
    unknownKnowledge(car), { ...known(truck), state: "unresolved_conflict" }] }),
    report: report({ vehicle_types: ["motorbike", "truck"], observation_ids: [lowObservation.observation_id, truck.observation_id] }) });
  const result = proposeReportReward(openedLedger(), input);
  expect(result.reason).toBe("CONFLICT"); expect(result.new_award).toBeNull(); expect(result.filled_gap_ids).toEqual([]);
});
