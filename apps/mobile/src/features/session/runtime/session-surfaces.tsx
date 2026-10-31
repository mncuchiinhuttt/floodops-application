import { OwnReportsScreen } from "../../reports/own-reports-screen";
import { Text } from "react-native";
import { Alert, Button } from "@floodops/ui-native";
import { useRouter } from "expo-router";
import { useNativeRuntime } from "./native-runtime";
import { workspaceLinks, type MobileContext } from "../../../shared/session-context";
import { ScreenFrame } from "../../../shared/screen-frame";
import { useResource, ResourceBoundary, commandContext } from "../../../shared/native/runtime-resource";
import { useNativeCommand } from "../../../shared/native/use-native-command";
import { nativeKey } from "../../../shared/native/random-key";
import { DriverScreen } from "../../driver/driver-screen";
import { ContributorScreen } from "../../rewards/contributor-screen";
import { PlanScreen } from "../../planning/plan-screen";
import { ResultsScreen } from "../../results/results-screen";
import { SourcesScreen } from "../../sources/sources-screen";
import { OverviewScreen } from "../../operations-map/overview-screen";
import { TimelineScreen } from "../../simulation/timeline-screen";
import { ReportEditor } from "../../reports/runtime/report-editor";
export function SessionSurface({ workspace }: { workspace: string }) {
  const runtime = useNativeRuntime(); const context = runtime.context; if (!context) return null;
  if (!workspaceLinks(context).some(link => link.id === workspace)) return <ScreenFrame title="Workspace unavailable" context={context}><Alert title="Capability required">This route is outside your authorized workspace.</Alert></ScreenFrame>;
  const body = workspace === "driver" ? <DriverRuntime context={context} /> : workspace === "contributor" ? <ContributorRuntime context={context} />
    : workspace === "report" ? <ReportEditor context={context} /> : workspace === "plan" || workspace === "overview" ? <DispatchSnapshot context={context} surface={workspace} />
    : workspace === "sources" ? <SourcesRuntime context={context} /> : workspace === "results" ? <ResultsRuntime context={context} />
    : workspace === "timeline" ? <TimelineRuntime context={context} /> : <ReviewList context={context} />;
  return <>{body}<Button label="Refresh current server views" onPress={() => void runtime.refresh().catch(() => undefined)} /></>;
}
function DriverRuntime({ context }: { context: MobileContext }) {
  const query = useResource(context, ["own-driver"], async (api, options) => { const result = await api.request("getOwnDriverDashboard", { path: { session_id: context.session.session_id } }, options); return { value: result.body.data, meta: result.body.meta }; });
  return <><DriverScreen context={context} query={query} />{query.status === "error" && <OwnReportsRuntime context={context} />}</>;
}
function ContributorRuntime({ context }: { context: MobileContext }) {
  const query = useResource(context, ["own-contributor"], async (api, options) => { const result = await api.request("getOwnContributorDashboard", { path: { session_id: context.session.session_id } }, options); return { value: result.body.data, meta: result.body.meta }; });
  return <><ContributorScreen context={context} query={query} />{query.status === "error" && <OwnReportsRuntime context={context} />}</>;
}
function DispatchSnapshot({ context, surface }: { context: MobileContext; surface: string }) {
  const runtime = useNativeRuntime(), command = useNativeCommand(); const path = { session_id: context.session.session_id };
  const query = useResource(context, ["snapshot-and-graph"], async (api, options) => {
    const snapshot = await api.request("getSessionSnapshot", { path }, options); const graph = await api.request("getSessionGraph", { path }, options);
    return { value: { snapshot: snapshot.body.data, graph: graph.body.data }, meta: snapshot.body.meta };
  });
  return <ResourceBoundary title="Dispatch server view" context={context} query={query}>{({ snapshot, graph }) => <>
    {command.error && <Alert title="Command status">{command.error}</Alert>}
    {surface === "overview" ? <OverviewScreen context={context} graph={graph} vehicle="motorbike" query={{ ...query, data: snapshot }} />
      : <PlanScreen context={commandContext(context, query)} plan={snapshot.latest_plan} currentPlan={snapshot.latest_plan ? { planId: snapshot.latest_plan.plan_id, planningJobId: snapshot.latest_plan.planning_job_id } : null}
        pending={command.pending} onDecide={input => void command.run(() => runtime.client!.decidePlan(snapshot.latest_plan!.plan_id, input, nativeKey()))}
        onExecute={input => void command.run(() => runtime.client!.executePlan(snapshot.latest_plan!.plan_id, input, nativeKey()))} />}
  </>}</ResourceBoundary>;
}
function SourcesRuntime({ context }: { context: MobileContext }) {
  const path = { session_id: context.session.session_id };
  const query = useResource(context, ["sources-knowledge"], async (api, options) => { const sources = await api.request("listSources", { path }, options), knowledge = await api.request("getKnowledge", { path }, options);
    return { value: { sources: sources.body.data.items, knowledge: knowledge.body.data }, meta: knowledge.body.meta }; });
  return <SourcesScreen context={context} query={query} />;
}
function ResultsRuntime({ context }: { context: MobileContext }) {
  const query = useResource(context, ["results"], async (api, options) => { const result = await api.request("getResults", { path: { session_id: context.session.session_id } }, options); return { value: result.body.data, meta: result.body.meta }; });
  return <ResultsScreen context={context} query={query} />;
}
function TimelineRuntime({ context }: { context: MobileContext }) {
  const runtime = useNativeRuntime(), command = useNativeCommand(); const path = { session_id: context.session.session_id };
  const query = useResource(context, ["clock-events"], async (api, options) => { const clock = await api.request("getSimulationClock", { path }, options), events = await api.request("getEvents", { path, query: { after: 0, limit: 100 } }, options);
    return { value: { clock: clock.body.data, events: events.body.data.events }, meta: clock.body.meta }; });
  return <ResourceBoundary title="Timeline" context={context} query={query}>{value => <>
    {command.error && <Alert title="Command status">{command.error}</Alert>}
    <TimelineScreen context={commandContext(context, query)} clock={value.clock} clockSession={{ ...context.session, revision: query.revision }} events={value.events} pending={command.pending}
      onAdvance={target => void command.run(() => runtime.client!.advance(target, nativeKey()))}
      onReset={() => void command.run(async () => { const result = await runtime.client!.reset({ client_type: "native", confirm: true }, nativeKey()); await runtime.stageReplacement(result.body.data.replacement); })} />
  </>}</ResourceBoundary>;
}
function ReviewList({ context }: { context: MobileContext }) {
  const router = useRouter(); const query = useResource(context, ["review-list"], async (api, options) => { const result = await api.request("listReports", { path: { session_id: context.session.session_id } }, options); return { value: result.body.data.items, meta: result.body.meta }; });
  return <ResourceBoundary title="Report review" context={context} query={query}>{reports => <ScreenFrame title="Report review" context={context}>
    {!reports.length && <Text>No accessible reports.</Text>}{reports.map(report => <Button key={report.report_id} label={`${report.report_id} · ${report.status}`}
      onPress={() => router.push({ pathname: "/sessions/[sessionId]/reports/[reportId]", params: { sessionId: context.session.session_id, reportId: report.report_id } })} />)}
  </ScreenFrame>}</ResourceBoundary>;
}

function OwnReportsRuntime({ context }: { context: MobileContext }) {
  const query = useResource(context, ["field-own-reports"], async (api, options) => {
    const result = await api.request("listReports", { path: { session_id: context.session.session_id } }, options);
    return { value: result.body.data.items, meta: result.body.meta };
  });
  return <OwnReportsScreen context={context} query={query} />;
}
