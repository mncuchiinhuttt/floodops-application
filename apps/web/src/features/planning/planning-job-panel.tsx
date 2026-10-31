import type { PlanningJob } from "@floodops/contracts";
import { Alert, Button, Card } from "@floodops/ui-web";
import { accessReason, type AccessContext } from "../../shared/access";
import { useCommand } from "../../shared/use-command";
const failures: Partial<Record<NonNullable<PlanningJob["error_code"]>, string>> = {
  NO_FEASIBLE_PLAN: "Chưa tìm thấy candidate hợp lệ trong giới hạn tìm kiếm. Không chứng minh mọi phương án đều bất khả thi.",
  PLANNER_TIMEOUT: "Planner hết thời gian server cho phép. Không có kế hoạch để Execute từ job này.",
  CONFIG_INCOMPLETE: "Cấu hình planner chưa đầy đủ.",
};
export function PlanningJobPanel({ context, job, unavailable, refreshing, onStart, onRefresh }: {
  context: AccessContext; job: PlanningJob | null; unavailable?: string; refreshing: boolean;
  onStart: () => Promise<void>; onRefresh: () => Promise<void>;
}) {
  const { session, participant } = context.identity;
  const command = useCommand(`${session.session_id}:${session.generation}:${participant.participant_id}`);
  if (job && (job.session_id !== session.session_id || job.generation !== session.generation)) return <Alert urgent title="Job thuộc phiên khác">Làm mới phiên trước khi xem job.</Alert>;
  const blocked = accessReason(context, "planning:request", "dispatcher", true);
  return <Card title="Planner xác định" description="Tìm kiếm có giới hạn theo cấu hình server. Kế hoạch là projected; Approve và Execute là thao tác thủ công riêng.">
    <Button pending={command.pending} {...(blocked ? { disabled: true, disabledReason: blocked } : { disabled: false })} onClick={() => void command.run(onStart)}>Yêu cầu lập kế hoạch</Button>
    <Button pending={refreshing} onClick={() => void command.run(onRefresh)}>Làm mới job planner</Button>
    {command.message && <Alert title="Trạng thái yêu cầu planner">{command.message}</Alert>}
    {unavailable && <Alert title="Planner chưa khả dụng">{unavailable}</Alert>}
    {job ? <section aria-label="Job planner từ server"><p>{job.job_id} · {job.status} · Input revision {job.input_revision}</p>
      <dl><dt>Thuật toán</dt><dd>{job.planner.kind} · {job.planner.algorithm_version}</dd>
        <dt>Giới hạn candidate</dt><dd>{job.planner.search_limit}</dd><dt>Config hash</dt><dd>{job.planner.config_hash}</dd></dl>
      {job.error_code && <Alert urgent title={job.error_code}>{failures[job.error_code] ?? "Job không hoàn tất. Làm mới trạng thái trước khi yêu cầu lại."}</Alert>}
      <p>{job.plan_id ? `Plan server: ${job.plan_id} · Chưa tự Execute.` : "Job chưa có plan khả dụng."}</p>
    </section> : <p>Chưa có job từ server được xác minh.</p>}
  </Card>;
}
