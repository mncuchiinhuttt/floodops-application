import type { Plan } from "@floodops/contracts";
export function latestPlanReason(input: { plan?: Plan; latest?: Plan | null; snapshotRevision?: number; currentRevision: number; fetching: boolean; snapshotReady: boolean }): string | undefined {
  if (!input.snapshotReady || input.fetching || !input.plan || !input.latest || input.latest.plan_id !== input.plan.plan_id ||
    input.latest.planning_job_id !== input.plan.planning_job_id || input.snapshotRevision !== input.currentRevision)
    return "Chưa xác minh được kế hoạch/job mới nhất. Làm mới trước khi gửi lệnh.";
  return undefined;
}
