import { parseSchema } from "@floodops/contracts";
import { sourceState } from "@floodops/domain/reporting";
import { reconcileEvidence } from "@floodops/domain/knowledge";
import { applyKnowledgeTransition } from "@floodops/simulation";
import type { TransitionContext } from "../../shared/index";
import { fail } from "../../shared/index";
import { sourceEnvironment } from "../scenario/index";
import type { SourcesPorts } from "../scenario/index";
import type { SourceReviewPort } from "./review/index";
import { currentSourceConflicts, reviewMetadata, same } from "./source-review-state";
type Change = Parameters<SourceReviewPort["apply"]>[1];
/** A pure full-values proposal; the Review reducer owns its atomic ledger/audit commit. */
export function applySourceReview(ports: SourcesPorts, context: TransitionContext, change: Change): Record<string, unknown> {
  if (context.actor.participant.role !== "dispatcher") fail(403, "FORBIDDEN");
  const state = sourceState(context.snapshot.values), run = ports.simulationPersistence.read(context.snapshot.values);
  const reports = change.reports.map(item => parseSchema("Report", item));
  const current = Object.values(state.reports).filter(item => item.generation === context.snapshot.meta.generation);
  if (reports.length !== current.length || new Set(reports.map(item => item.report_id)).size !== reports.length) fail(409, "STATE_CONFLICT");
  for (const report of reports) {
    const stored = state.reports[report.report_id];
    if (!stored || stored.generation !== context.snapshot.meta.generation) fail(409, "STATE_CONFLICT");
    const immutable = (item: typeof report) => {
      const { status: _s, segment_id: _g, vehicle_types: _v, observation_candidates: _c, observation_ids: _o, award_id: _a, reason_codes: _r, ...facts } = item;
      void _s; void _g; void _v; void _c; void _o; void _a; void _r; return facts;
    };
    if (!same(immutable(stored.report), immutable(report))) fail(409, "STATE_CONFLICT");
    if (["accepted", "rejected"].includes(stored.report.status) && (report.status !== stored.report.status
      || report.segment_id !== stored.report.segment_id || !same(report.vehicle_types, stored.report.vehicle_types))) fail(409, "STATE_CONFLICT");
    state.reports[report.report_id] = { ...stored, report };
  }
  const observations = change.observations.map(item => parseSchema("Observation", item));
  const knowledge = change.knowledge.map(item => parseSchema("SegmentKnowledge", item));
  if (knowledge.length !== run.knowledge.length || new Set(knowledge.map(pair => JSON.stringify([pair.segment_id, pair.vehicle_type]))).size !== knowledge.length || knowledge.some(pair => !run.knowledge.some(old => old.segment_id === pair.segment_id
    && old.vehicle_type === pair.vehicle_type && old.knowledge_epoch === pair.knowledge_epoch))) fail(409, "STATE_CONFLICT");
  const environment = { ...sourceEnvironment(ports, context.snapshot), observations };
  const derived = reconcileEvidence(run.knowledge, environment);
  if (!same(derived.knowledge, knowledge) || !same(derived.observations, observations)) fail(409, "STATE_CONFLICT");
  const next = same(run.knowledge, knowledge) && same(run.sourceSnapshot.observations, observations) ? run
    : applyKnowledgeTransition(run, knowledge, { sourceSnapshot: { ...run.sourceSnapshot, observations }, reasonId: context.actor.participant.participant_id });
  const metadata = reviewMetadata(context.snapshot), conflicts = change.conflicts.map(item => parseSchema("Conflict", item));
  if (new Set(conflicts.map(item => item.conflict_id)).size !== conflicts.length) fail(409, "STATE_CONFLICT");
  const baseline = currentSourceConflicts(context.snapshot, reconcileEvidence(run.knowledge, sourceEnvironment(ports, context.snapshot)).knowledge);
  for (const conflict of conflicts) {
    const old = baseline.find(item => item.conflict_id === conflict.conflict_id);
    if (old && (old.segment_id !== conflict.segment_id || old.vehicle_type !== conflict.vehicle_type || old.knowledge_epoch !== conflict.knowledge_epoch
      || (old.status === "resolved" && !same(old, conflict)))) fail(409, "STATE_CONFLICT");
    if (!old && !knowledge.some(pair => pair.state === "unresolved_conflict" && pair.segment_id === conflict.segment_id
      && pair.vehicle_type === conflict.vehicle_type && pair.knowledge_epoch === conflict.knowledge_epoch
      && same(pair.observation_ids, conflict.observation_ids))) fail(409, "STATE_CONFLICT");
  }
  // Retain historical occurrences omitted from the current projection.
  metadata.conflicts = [...metadata.conflicts.filter(item => !conflicts.some(current => current.conflict_id === item.conflict_id)), ...conflicts];
  return ports.simulationPersistence.write({ ...context.snapshot.values, sourcesMedia: state, sourceReview: metadata }, next);
}
