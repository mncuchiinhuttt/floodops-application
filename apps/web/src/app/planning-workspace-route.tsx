import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { latestPlanningJob, type CreatedPlanningJob } from "./latest-job";
import { createIdempotencyKey } from "@floodops/api-client";
import { PlanningJobPanel } from "../features/planning/planning-job-panel";
import { ResourceView } from "../shared/feature-state";
import { useRuntime, useRuntimeSnapshot } from "./context";
import { readOptions, refreshAfterCommand, resourceOf } from "./queries";
import { failureText } from "./failure";
export function PlanningWorkspaceRoute() {
  const runtime = useRuntime(); useRuntimeSnapshot(); const context = runtime.context(), { session } = context.identity;
  const [created, setCreated] = useState<CreatedPlanningJob | null>(null);
  const path = { session_id: session.session_id };
  const plans = useQuery(readOptions(runtime, "listPlans", "operations:read", "dispatcher", { path }));
  const snapshot = useQuery(readOptions(runtime, "getSessionSnapshot", "operations:read", "dispatcher", { path }));
  const selected = latestPlanningJob(session, snapshot.isSuccess ? snapshot.data.body.meta : undefined, snapshot.data?.body.data.active_job, created);
  const jobId = selected?.job_id ?? "";
  const query = useQuery({ ...readOptions(runtime, "getPlanningJob", "operations:read", "dispatcher", { path: { ...path, job_id: jobId } }), enabled: !!jobId });
  const job = query.isSuccess ? query.data.body.data : selected;
  return <main><h1>Kế hoạch server</h1>
    <PlanningJobPanel context={context} job={job} refreshing={query.isFetching || snapshot.isFetching}
      unavailable={query.isError ? failureText(query.error) : snapshot.isError ? failureText(snapshot.error) : undefined}
      onStart={async () => {
        const response = await runtime.planning.start({ cause: "manual", cause_entity_ids: [] }, createIdempotencyKey()).send();
        setCreated({ job: response.body.data, meta: response.body.meta }); await refreshAfterCommand(runtime);
      }} onRefresh={async () => { await refreshAfterCommand(runtime); }} />
    {job?.plan_id && <Link to={job.plan_id}>Mở plan projected {job.plan_id}</Link>}
    <ResourceView resource={resourceOf(plans)}>{data => <ul>{data.items.map(plan =>
      <li key={plan.plan_id}><Link to={plan.plan_id}>{plan.plan_id}</Link> · {plan.status} · Projected</li>)}</ul>}</ResourceView>
  </main>;
}
