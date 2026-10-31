import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { createIdempotencyKey } from "@floodops/api-client";
import { Alert } from "@floodops/ui-web";
import { PlanScreen } from "../features";
import { useRuntime, useRuntimeSnapshot } from "./context";
import { readOptions, refreshAfterCommand, resourceOf } from "./queries";
import { failureText } from "./failure";
import { latestPlanReason } from "./latest-plan";
export function PlanRoute() {
  const runtime = useRuntime(); useRuntimeSnapshot(); const { planId = "" } = useParams(), context = runtime.context(), { session } = context.identity;
  const query = useQuery(readOptions(runtime, "getPlan", "operations:read", "dispatcher", { path: { session_id: session.session_id, plan_id: planId } }));
  const snapshot = useQuery(readOptions(runtime, "getSessionSnapshot", "operations:read", "dispatcher", { path: { session_id: session.session_id } }));
  const plan = query.data?.body.data, latest = snapshot.data?.body.data.latest_plan;
  const blocked = latestPlanReason({ plan, latest, snapshotRevision: snapshot.data?.body.data.session.revision, currentRevision: session.revision,
    fetching: query.isFetching || snapshot.isFetching, snapshotReady: snapshot.isSuccess });
  return <>{snapshot.isError && <Alert title="Không xác minh được latest plan">{failureText(snapshot.error)}</Alert>}
    <PlanScreen context={context} resource={resourceOf(query)} commandBlockedReason={blocked}
      onDecision={async body => { await runtime.planning.decide(planId, body, createIdempotencyKey()).send(); await refreshAfterCommand(runtime); }}
      onDryRun={async body => { await runtime.planning.dryRun(planId, body, createIdempotencyKey()).send(); await runtime.queries.invalidateQueries({ queryKey: ["session"] }); }}
      onExecute={async body => { await runtime.planning.execute(planId, body, createIdempotencyKey()).send(); await refreshAfterCommand(runtime); }} />
  </>;
}
