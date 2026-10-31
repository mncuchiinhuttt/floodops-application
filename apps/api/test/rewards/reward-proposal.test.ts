import { expect, test } from "bun:test";
import { AwardSchema, ContractValidationError } from "@floodops/contracts";
import { proposeReportReward, RewardProposalError } from "../../../../packages/domain/src/rewards/index.ts";
import type { RewardConfig } from "../../../../packages/domain/src/rewards/index.ts";
import { bike, car, context, coverage, freeze, hashA, known, lowObservation, openedLedger, report, rewardInput, source, unknownKnowledge } from "./fixtures.ts";

test("accepted fresh low-confidence citizen photo proposes one configured award with isolated immutable ledger", () => {
  const ledger = freeze(openedLedger()), input = freeze(rewardInput()), oldLedger = structuredClone(ledger), oldInput = structuredClone(input);
  const result = proposeReportReward(ledger, input);
  expect(result.reason).toBe("AWARDED"); expect(result.new_award).toEqual({ award_id: context.award_id,
    report_id: input.report.report_id, contributor_id: input.report.reporter_entity_id, filled_gap_ids: ["gap_bike001"],
    points: 7, event_sequence: 2, awarded_at: context.awarded_at, is_simulated: true });
  expect(AwardSchema.parse(result.new_award)).toEqual(result.new_award!);
  expect(result.ledger.gaps.find(gap => gap.vehicle_type === "car")?.status).toBe("open");
  expect(result.ledger.gaps.find(gap => gap.vehicle_type === "motorbike")?.first_award_id).toBe(context.award_id);
  expect(ledger).toEqual(oldLedger); expect(input).toEqual(oldInput);
  expect(Object.isFrozen(result.ledger.photos)).toBeTrue(); expect(Object.isFrozen(result.ledger.gaps[0])).toBeTrue();
  expect(result.ledger).not.toHaveProperty("knowledge"); expect(result.ledger).not.toHaveProperty("route_approved");
});
test("same committed proposal replay returns no new award or changes; new context also cannot multiply it", () => {
  const input = rewardInput(), first = proposeReportReward(openedLedger(), input);
  for (const event_sequence of [2, 3]) {
    const again = proposeReportReward(first.ledger, { ...input, context: { ...context, event_sequence } });
    expect(again.reason).toBe("ALREADY_AWARDED"); expect(again.new_award).toBeNull(); expect(again.filled_gap_ids).toEqual([]);
    expect(again.ledger).toEqual(first.ledger); expect(again.ledger.awards).toHaveLength(1);
  }
});
test("one multi-vehicle report fills both relevant gaps with one award and one photo claim", () => {
  const observation = { ...lowObservation, vehicle_types: ["motorbike", "car"] as const };
  const input = rewardInput({ report: report({ vehicle_types: ["motorbike", "car"] }), after: coverage({
    observations: [{ ...observation, vehicle_types: [...observation.vehicle_types] }],
    knowledge: [known({ ...observation, vehicle_types: [...observation.vehicle_types] }, "motorbike"), known({ ...observation, vehicle_types: [...observation.vehicle_types] }, "car")] }) });
  const result = proposeReportReward(openedLedger(), input);
  expect(result.new_award?.filled_gap_ids).toEqual(["gap_bike001", "gap_car0001"]); expect(result.new_award?.points).toBe(7);
  expect(result.ledger.awards).toHaveLength(1); expect(result.ledger.photos).toHaveLength(1);
});
test("normalized hash reused by a different contributor/report is denied before any gap or award effect", () => {
  const first = proposeReportReward(openedLedger(), rewardInput());
  const observation = { ...lowObservation, observation_id: "obs_other001", vehicle_types: ["car"] as const, evidence_ids: ["rpt_other001"] };
  const nextInput = rewardInput({ report: report({ report_id: "rpt_other001", reporter_entity_id: "con_person002", vehicle_types: ["car"], observation_ids: [observation.observation_id] }),
    photo: { report_id: "rpt_other001", normalized_hash: hashA, ready: true },
    after: coverage({ knowledge: [unknownKnowledge(bike), known({ ...observation, vehicle_types: [...observation.vehicle_types] })],
      observations: [{ ...observation, vehicle_types: [...observation.vehicle_types] }] }), context: { ...context, event_sequence: 3, award_id: "awd_other001" } });
  const result = proposeReportReward(first.ledger, nextInput);
  expect(result.reason).toBe("DUPLICATE_IMAGE"); expect(result.new_award).toBeNull(); expect(result.ledger).toEqual(first.ledger);
  expect(result.ledger.gaps.find(gap => gap.vehicle_type === "car")?.status).toBe("open");
});
test("driver quick reports and camera/system evidence can fill but cannot receive citizen rewards", () => {
  const driverSource = { ...source, source_type: "driver" as const };
  const driver = rewardInput({ report: report({ kind: "driver", input_mode: "quick", media_id: null, fixture_photo_id: null, quick_condition: "normal" }), photo: null,
    after: coverage({ knowledge: [known(lowObservation), unknownKnowledge(car)], observations: [lowObservation], sources: [driverSource] }) });
  const driverResult = proposeReportReward(openedLedger(), driver);
  expect(driverResult.reason).toBe("NOT_ELIGIBLE"); expect(driverResult.new_award).toBeNull(); expect(driverResult.filled_gap_ids).toEqual(["gap_bike001"]);
  expect(driverResult.ledger.photos).toEqual([]);
  const camera = rewardInput({ after: { ...rewardInput().after, sources: [{ ...source, source_type: "camera" }] } });
  expect(proposeReportReward(openedLedger(), camera).reason).toBe("NOT_ELIGIBLE");
  expect(proposeReportReward(openedLedger(), camera).ledger.awards).toEqual([]);
});
test("pending/rejected never fills; not-ready media cannot produce an accepted photo proposal", () => {
  const ledger = openedLedger();
  for (const status of ["pending_review", "rejected"] as const) {
    const result = proposeReportReward(ledger, rewardInput({ report: report({ status }) }));
    expect(result.reason).toBe("NOT_ACCEPTED"); expect(result.ledger).toEqual(ledger);
  }
  for (const photo of [null, { report_id: "rpt_bike001", normalized_hash: hashA, ready: false }]) {
    expect(proposeReportReward(ledger, rewardInput({ photo })).reason).toBe("MEDIA_NOT_READY");
    expect(proposeReportReward(ledger, rewardInput({ photo })).ledger).toEqual(ledger);
  }
});
test("redundant or unattributed accepted evidence does not fill or earn; stored hash still prevents future duplication", () => {
  const normal = rewardInput(), coveredBefore = normal.after;
  const redundant = proposeReportReward(openedLedger(), { ...normal, before: coveredBefore });
  expect(redundant.reason).toBe("VALID_BUT_REDUNDANT"); expect(redundant.filled_gap_ids).toEqual([]); expect(redundant.new_award).toBeNull();
  expect(redundant.ledger.photos).toHaveLength(1);
  const unattributed = proposeReportReward(openedLedger(), rewardInput({ report: report({ observation_ids: ["obs_missing1"] }) }));
  expect(unattributed.filled_gap_ids).toEqual([]); expect(unattributed.new_award).toBeNull();
  const wrongEvidence = { ...lowObservation, evidence_ids: ["rpt_other001"] };
  expect(proposeReportReward(openedLedger(), rewardInput({ after: coverage({ observations: [wrongEvidence], knowledge: [known(wrongEvidence)] }) })).new_award).toBeNull();
});
test("essential points/config never default; explicit disabled source eligibility gives zero awards", () => {
  for (const config of [undefined, {}, { points_per_report: 10 }, { points_per_report: 0, eligible_source_ids: [] },
    { points_per_report: 1.5, eligible_source_ids: [] }, { points_per_report: Infinity, eligible_source_ids: [] }]) {
    try { proposeReportReward(openedLedger(), rewardInput({ config: config as RewardConfig })); throw new Error("Expected config failure"); }
    catch (error) { expect(error).toBeInstanceOf(RewardProposalError); expect((error as RewardProposalError).code).toBe("CONFIG_INCOMPLETE"); }
  }
  const result = proposeReportReward(openedLedger(), rewardInput({ config: { points_per_report: 17, eligible_source_ids: [] } }));
  expect(result.reason).toBe("NOT_ELIGIBLE"); expect(result.new_award).toBeNull();
  expect(proposeReportReward(openedLedger(), rewardInput({ config: { points_per_report: 17, eligible_source_ids: [source.source_id] } })).new_award?.points).toBe(17);
});
test("bindings, frozen transition clock/scope, and strict report fields fail closed", () => {
  const ledger = openedLedger(), input = rewardInput();
  const bad = [
    { ...input, context: { ...context, session_id: "ses_other001" } }, { ...input, context: { ...context, generation: 2 } },
    { ...input, context: { ...context, event_sequence: 0 } }, { ...input, context: { ...context, event_sequence: 1 } },
    { ...input, photo: { ...input.photo!, report_id: "rpt_other001" } }, { ...input, photo: { ...input.photo!, normalized_hash: "client-url" } },
    { ...input, after: { ...input.after, now_sim_minute: 4 } }, { ...input, after: { ...input.after, scope: [car] } },
    { ...input, report: report({ award_id: "awd_missing1" }) },
  ];
  for (const value of bad) expect(() => proposeReportReward(ledger, value)).toThrow(RewardProposalError);
  expect(() => proposeReportReward(ledger, { ...input, report: { ...input.report, quality_score: 100 } } as typeof input)).toThrow(ContractValidationError);
});
