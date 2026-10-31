import { parseM1ReviewResult } from "@floodops/contracts";
import type { Report, ReviewInput } from "@floodops/contracts";
import { proposeObservationAcceptance } from "@floodops/domain/knowledge";
import { proposeReportReward } from "@floodops/domain/rewards";
import { fail } from "../../../shared/index";
import type { Transition, TransitionContext } from "../../../shared/index";
import type { ReviewOptions } from "./runtime-types";
import { resolvePinnedReward } from "../../rewards/reward-policy";
import { attachAward, humanReview } from "./review-result";
import { coverageState, currentConflicts, openCurrentGaps, readReviewStore, reviewId, sourceFailure } from "./state";

export function reviewReportTransition(options: ReviewOptions, context: TransitionContext, reportId: string, input: ReviewInput): Transition {
  try {
    if (context.actor.participant.role !== "dispatcher") fail(403, "FORBIDDEN");
    const state = options.source.read(context), original = state.reports.find(report => report.report_id === reportId);
    if (!original) fail(404, "NOT_FOUND");
    if (!["pending_review", "needs_clarification"].includes(original.status)) fail(409, "STATE_CONFLICT");
    const store = readReviewStore(context), id = options.id ?? reviewId;
    const audit = { report_id: reportId, decision: input.decision, reason: input.reason,
      actor_id: context.actor.participant.participant_id, at: new Date(context.now).toISOString() };
    if (input.decision === "reject") {
      const rejected = humanReview({ ...original, observation_candidates: [] }, "rejected", id("review"), audit.at);
      attachAward(original, rejected, null);
      const values = options.source.apply(context, { ...state, reports: state.reports.map(report => report.report_id === reportId ? rejected : report),
        observations: state.evidence.observations });
      return { values: { ...values, reviewRewards: { ...store, audit: [...store.audit, audit] } },
        data: parseM1ReviewResult( { report: rejected, observations: [], filled_gap_ids: [], award: null, planning_job_id: null }),
        events: [{ type: "report_changed", resource_ids: [reportId], audience: ["dispatcher"], participantIds: [original.participant_id] }] };
    }
    if (original.status !== "pending_review" || input.condition === null || input.condition === "unknown") fail(409, "STATE_CONFLICT");
    const confirmed: Report = { ...original, segment_id: input.mapped_segment_id ?? original.segment_id,
      vehicle_types: input.vehicle_types.length ? input.vehicle_types : original.vehicle_types };
    const before = coverageState(context, state), originalContext = options.source.reportContext(context, original);
    const proposed = proposeObservationAcceptance(confirmed, input.condition, state.pairs, { ...originalContext, ...state.evidence,
      observationIds: confirmed.vehicle_types.map(vehicle_type => ({ vehicle_type, observation_id: id("observation") })), reasonId: id("review") });
    const after = { ...before, observations: proposed.observations, knowledge: proposed.knowledge };
    const media = options.source.image(context.snapshot, original);
    if (media?.duplicate) fail(422, "DUPLICATE_IMAGE");
    const reviewed = humanReview(proposed.report, "accepted", id("review"), audit.at);
    const reward = proposeReportReward(store.ledger, { before, after, report: reviewed,
      photo: media ? { report_id: reportId, normalized_hash: media.normalized_hash, ready: media.ready && !media.duplicate } : null,
      config: resolvePinnedReward(options, original.reward.policy), context: { session_id: context.snapshot.meta.session_id, generation: context.snapshot.meta.generation,
        event_sequence: context.snapshot.meta.event_sequence + 2, award_id: id("award"), awarded_at: new Date(context.now).toISOString() } });
    if (reward.reason === "DUPLICATE_IMAGE") fail(422, "DUPLICATE_IMAGE");
    const ledger = openCurrentGaps(context, reward.ledger, after, context.snapshot.meta.event_sequence + 3, id);
    const report = attachAward(original, reviewed, reward.new_award);
    const values = options.source.apply(context, { reports: state.reports.map(item => item.report_id === reportId ? report : item),
      observations: proposed.observations, knowledge: proposed.knowledge, conflicts: currentConflicts(state.conflicts, proposed.knowledge, id) });
    return { values: { ...values, reviewRewards: { ledger, audit: [...store.audit, audit] } },
      data: parseM1ReviewResult( { report, observations: proposed.observations.filter(item => item.evidence_ids.includes(reportId)),
        filled_gap_ids: reward.filled_gap_ids, award: reward.new_award, planning_job_id: null }),
      events: [{ type: "report_changed", resource_ids: [reportId], audience: ["dispatcher"], participantIds: [original.participant_id] },
        reward.new_award ? { type: "award_created", resource_ids: [reward.new_award.award_id], audience: ["dispatcher"], participantIds: [original.participant_id] }
          : { type: "state_changed", resource_ids: [reportId] }, { type: "state_changed", resource_ids: [reportId] }] };
  } catch (error) { return sourceFailure(error); }
}
