import type { Meta, Plan, PlanningJob, SessionMeta } from "@floodops/contracts";
export function latestPlanReason(input: {
  plan?: Plan; latest?: Plan | null; activeJob?: PlanningJob | null;
  planMeta?: Meta; snapshotMeta?: Meta; snapshotSession?: SessionMeta; current: SessionMeta;
  fetching: boolean; snapshotReady: boolean;
}): string | undefined {
  const { plan, latest, activeJob: job, current } = input;
  const currentMeta = (meta: Meta | undefined) => !!meta && meta.session_id === current.session_id && meta.generation === current.generation &&
    meta.revision === current.revision && typeof meta.event_sequence === "number" && meta.event_sequence >= current.event_sequence;
  const snapshot = input.snapshotSession;
  if (!input.snapshotReady || input.fetching || !plan || !latest || !job || !currentMeta(input.planMeta) || !currentMeta(input.snapshotMeta) ||
    !snapshot || snapshot.session_id !== current.session_id || snapshot.generation !== current.generation || snapshot.revision !== current.revision ||
    plan.session_id !== current.session_id || plan.generation !== current.generation || plan.input_revision !== current.revision ||
    JSON.stringify(latest) !== JSON.stringify(plan) || job.status !== "completed" || job.job_id !== plan.planning_job_id ||
    job.plan_id !== plan.plan_id || job.session_id !== current.session_id || job.generation !== current.generation || job.input_revision !== plan.input_revision)
    return "Chưa xác minh được kế hoạch/job mới nhất. Làm mới trước khi gửi lệnh.";
  return undefined;
}
