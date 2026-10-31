import { parseSchema } from "@floodops/contracts";
import type { ConflictResolutionInput, Report } from "@floodops/contracts";
import { proposeConflictResolution } from "@floodops/domain/knowledge";
import { proposeReportReward } from "@floodops/domain/rewards";
import { fail } from "../../../shared/index";
type EventInput = NonNullable<Transition["events"]>[number];
import type { Transition, TransitionContext } from "../../../shared/index";
import type { ReviewOptions } from "../../reports/review/runtime-types";
import { resolvePinnedReward } from "../../rewards/reward-policy";
import { attachAward } from "../../reports/review/review-result";
import { coverageState, openCurrentGaps, readReviewStore, reviewId, sourceFailure } from "../../reports/review/state";

export function resolveConflictTransition(options: ReviewOptions, context: TransitionContext, conflictId: string, input: ConflictResolutionInput): Transition {
  try {
    if (context.actor.participant.role !== "dispatcher") fail(403, "FORBIDDEN");
    const state = options.source.read(context), conflict = state.conflicts.find(item => item.conflict_id === conflictId);
    if (!conflict) fail(404, "NOT_FOUND");
    if (conflict.status !== "unresolved") fail(409, "STATE_CONFLICT");
    const proposed = proposeConflictResolution({ pair: { segment_id: conflict.segment_id,
      vehicle_type: conflict.vehicle_type, knowledge_epoch: conflict.knowledge_epoch }, pairs: state.pairs, keepObservationIds: input.keep_observation_ids,
      supersedeObservationIds: input.supersede_observation_ids, reasonId: input.reason }, state.evidence);
    const before = coverageState(context, state), after = { ...before, knowledge: proposed.knowledge, observations: proposed.observations };
    const store = readReviewStore(context), id = options.id ?? reviewId;
    let ledger = store.ledger;
    const reports = structuredClone([...state.reports]), awards = [], filled: string[] = [];
    const events: EventInput[] = [{ type: "state_changed", resource_ids: [conflictId] }];
    const affected = reports.filter(report => report.status === "accepted" && report.observation_ids.some(obs => input.keep_observation_ids.includes(obs)))
      .sort((a, b) => a.report_id < b.report_id ? -1 : a.report_id > b.report_id ? 1 : 0);
    for (const report of affected) {
      const media = options.source.image(context.snapshot, report);
      // Conflict resolution is not a second report review; retain the accepted ReviewResult and its timestamp.
      const reviewed = report;
      const reward = proposeReportReward(ledger, { before, after, report: reviewed,
        photo: media ? { report_id: report.report_id, normalized_hash: media.normalized_hash, ready: media.ready && !media.duplicate } : null,
        config: resolvePinnedReward(options, report.reward.policy), context: { session_id: context.snapshot.meta.session_id, generation: context.snapshot.meta.generation,
          event_sequence: context.snapshot.meta.event_sequence + events.length + 1, award_id: id("award"), awarded_at: reviewed.reviewed_at! } });
      ledger = reward.ledger; filled.push(...reward.filled_gap_ids);
      if (reward.new_award) awards.push(reward.new_award);
      Object.assign(report, attachAward(report, reviewed, reward.new_award));
      events.push({ type: reward.new_award ? "award_created" : "report_changed", resource_ids: [report.report_id],
        audience: ["dispatcher"], participantIds: [report.participant_id] });
    }
    ledger = openCurrentGaps(context, ledger, after, context.snapshot.meta.event_sequence + events.length + 1, id);
    events.push({ type: "state_changed", resource_ids: [conflictId] });
    const resolved = { ...conflict, status: "resolved" as const, resolution_reason: input.reason };
    const values = options.source.apply(context, { reports: reports as Report[], knowledge: proposed.knowledge,
      observations: proposed.observations, conflicts: state.conflicts.map(item => item.conflict_id === conflictId ? resolved : item) });
    return { values: { ...values, reviewRewards: { ...store, ledger } }, events,
      data: parseSchema("ConflictResolutionResult", { conflict: resolved, observations: proposed.observations,
        filled_gap_ids: [...new Set(filled)], awards, planning_job_id: null }) };
  } catch (error) { return sourceFailure(error); }
}
