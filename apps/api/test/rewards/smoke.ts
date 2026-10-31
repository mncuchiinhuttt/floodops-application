import { deriveImageReviewAdvice } from "../../src/features/reports/review/rubric/index.ts";
import { deriveUsefulCoverage, proposeReportReward } from "../../../../packages/domain/src/rewards/index.ts";
import { openedLedger, rewardInput, scenario } from "./fixtures.ts";

const input = rewardInput();
const advice = deriveImageReviewAdvice({ quality_ratings: { sharpness: 1, lighting: 2, scene_visibility: 1, detail: 2 },
  visible_summary: "Synthetic visible scene", report_match: "yes", mismatch_notes: [], reasons: ["Bounded fixture content"] });
const proposal = proposeReportReward(openedLedger(), input);
const replay = proposeReportReward(proposal.ledger, input);
if (advice.quality_score !== 75 || proposal.new_award?.points !== 7 || replay.new_award !== null) throw new Error("Domain smoke failed");
console.log(JSON.stringify({ kind: "functional_fixture_partial_domain_smoke", score: advice.quality_score, recommendation: advice.recommendation,
  coverage: deriveUsefulCoverage(input.after).coverage, new_award_points: proposal.new_award.points,
  filled_gaps: proposal.filled_gap_ids, replay_new_award: replay.new_award,
  car_gap: proposal.ledger.gaps.find(gap => gap.vehicle_type === "car")?.status, report_status: input.report.status,
  seed_hash: new Bun.CryptoHasher("sha256").update(scenario.seed).digest("hex"),
  config_hash: new Bun.CryptoHasher("sha256").update(JSON.stringify(scenario.config)).digest("hex"),
  qualification: "Pure candidates only; no durable commit, provider or route authorization" }));
