import type { Meta, PlanningJob, SessionMeta } from "@floodops/contracts";
export type CreatedPlanningJob = { job: PlanningJob; meta: Meta };
export function latestPlanningJob(current: SessionMeta, snapshotMeta: Meta | undefined, snapshotJob: PlanningJob | null | undefined, created: CreatedPlanningJob | null): PlanningJob | null {
  const sequence = snapshotMeta?.event_sequence;
  if (snapshotMeta?.session_id === current.session_id && snapshotMeta.generation === current.generation && snapshotMeta.revision === current.revision &&
    typeof sequence === "number" && sequence >= current.event_sequence && (!created || typeof created.meta.event_sequence !== "number" || sequence >= created.meta.event_sequence))
    return snapshotJob ?? null;
  return created?.job ?? null;
}
