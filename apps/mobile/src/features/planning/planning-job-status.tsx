import { Text } from "react-native";
import { Alert, Card } from "@floodops/ui-native";
import type { PlanningJob } from "@floodops/contracts";
import { sameSession, type MobileContext } from "../../shared/session-context";
export function PlanningJobStatus({ context, job }: { context: MobileContext; job: PlanningJob | null }) {
  if (!job) return null;
  if (!sameSession(context.session, job)) return <Alert title="Planner status unavailable">Refresh the current session.</Alert>;
  return <Card title={`Deterministic planner · ${job.status}`}>
    <Text>Algorithm: {job.planner.algorithm_version} · Config: {job.planner.config_hash}</Text>
    <Text>Candidate evaluation limit: {job.planner.search_limit}</Text>
    <Text>Job: {job.job_id} · Input revision: {job.input_revision}</Text>
    {job.error_code && <Text>Planner reason: {job.error_code}</Text>}
    {job.error_code === "NO_FEASIBLE_PLAN" && <Text>No valid candidate was found within the bounded search. Current assignments remain unchanged; request a new plan explicitly.</Text>}
    {job.error_code === "PLANNER_TIMEOUT" && <Text>The planner deadline elapsed. Current assignments remain unchanged; request a new plan explicitly.</Text>}
  </Card>;
}
