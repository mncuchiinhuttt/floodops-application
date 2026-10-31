import { expect, test } from "bun:test";
import { createRewardLedger, projectActiveGaps, proposeGapOpenings, proposeReportReward, proposeSourceGapFills, RewardProposalError } from "@floodops/domain/rewards";
import { bike, car, context, coverage, freeze, openedLedger, rewardInput } from "../rewards/fixtures.ts";

function history() {
  const oldScope = [bike, car].map(pair => ({ ...pair, knowledge_epoch: 0 }));
  const old = proposeGapOpenings(createRewardLedger(context.session_id, 1, 0), coverage({ scope: oldScope }),
    { ...context, event_sequence: 1 }, oldScope.map(pair => ({ ...pair, gap_id: `gap_old_${pair.vehicle_type}` })));
  const current = proposeGapOpenings(old, coverage(), { ...context, event_sequence: 2 },
    [{ ...bike, gap_id: "gap_new_motorbike" }, { ...car, gap_id: "gap_new_car001" }]);
  return { old, current };
}
test("current epoch projection retains old open rows only in audit history", () => {
  const { old, current } = history(), previous = structuredClone(current);
  expect(projectActiveGaps(old, [bike, car])).toEqual([]);
  const active = projectActiveGaps(current, [bike, car]);
  expect(active.map(gap => gap.gap_id)).toEqual(["gap_new_motorbike", "gap_new_car001"]);
  expect(current.gaps.filter(gap => gap.knowledge_epoch === 0).every(gap => gap.status === "open")).toBeTrue();
  expect(current.gaps).toHaveLength(4); expect(current).toEqual(previous);
  expect(Object.isFrozen(active)).toBeTrue(); expect(Object.isFrozen(active[0])).toBeTrue(); expect(active[0]).not.toBe(current.gaps[2]);
});
test("removed segment/vehicle scope and filled rows are excluded; ledger order is preserved", () => {
  const { current } = history();
  expect(projectActiveGaps(current, [car]).map(gap => gap.gap_id)).toEqual(["gap_new_car001"]);
  expect(projectActiveGaps(current, [{ ...bike, segment_id: "seg_removed1" }])).toEqual([]);
  expect(projectActiveGaps(current, [])).toEqual([]);
  const awarded = proposeReportReward(openedLedger(), rewardInput()).ledger;
  expect(projectActiveGaps(awarded, [car, bike]).map(gap => gap.vehicle_type)).toEqual(["car"]);
  expect(awarded.gaps.find(gap => gap.vehicle_type === "motorbike")?.status).toBe("filled");
});
test("a new-epoch report can fill and earn only against the new occurrence", () => {
  const { current } = history(), snapshot = structuredClone(current);
  const result = proposeReportReward(current, rewardInput({ context: { ...context, event_sequence: 3 } }));
  expect(result.new_award?.filled_gap_ids).toEqual(["gap_new_motorbike"]); expect(result.new_award?.points).toBe(7);
  expect(result.ledger.gaps.filter(gap => gap.knowledge_epoch === 0).every(gap => gap.status === "open" && gap.first_award_id === null)).toBeTrue();
  expect(projectActiveGaps(result.ledger, [bike, car]).map(gap => gap.gap_id)).toEqual(["gap_new_car001"]);
  expect(current).toEqual(snapshot);
});
test("non-report recovery fills only the current occurrence without rewriting old open gaps or earning", () => {
  const { current } = history(), input = rewardInput();
  const camera = { ...input.after, sources: input.after.sources.map(source => ({ ...source, source_type: "camera" as const })) };
  const result = proposeSourceGapFills(current, input.before, camera, { ...context, event_sequence: 3 });
  expect(result.awards).toEqual([]); expect(result.photos).toEqual([]);
  expect(result.gaps.find(gap => gap.gap_id === "gap_new_motorbike")?.status).toBe("filled");
  expect(result.gaps.filter(gap => gap.knowledge_epoch === 0).every(gap => gap.status === "open")).toBeTrue();
});
test("epoch bump alone does not fabricate a filled status or allow old gap IDs to be reused", () => {
  const { old } = history(), original = structuredClone(old);
  expect(projectActiveGaps(freeze(old), [bike, car])).toEqual([]); expect(old).toEqual(original);
  expect(() => proposeGapOpenings(old, coverage(), { ...context, event_sequence: 2 },
    [{ ...bike, gap_id: "gap_old_motorbike" }, { ...car, gap_id: "gap_new_car001" }])).toThrow(RewardProposalError);
});
test("ambiguous pairs and invalid current epoch are rejected rather than hiding history by guessing", () => {
  const { current } = history();
  for (const scope of [[bike, bike], [bike, { ...bike, knowledge_epoch: 2 }], [{ ...bike, knowledge_epoch: -1 }],
    [{ ...bike, knowledge_epoch: NaN }], [{ ...bike, knowledge_epoch: Number.MAX_SAFE_INTEGER + 1 }]]) {
    expect(() => projectActiveGaps(current, scope)).toThrow(RewardProposalError);
  }
});
