import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Alert, Card } from "@floodops/ui-web";
import { ContributorWorkspace, DriverWorkspace } from "../features";
import { useRuntime, useRuntimeSnapshot } from "./context";
import { readOptions, resourceOf } from "./queries";
import { ResourceView, type Resource } from "../shared/feature-state";
import { failureText } from "./failure";

export function DriverRoute() {
  const runtime = useRuntime(); useRuntimeSnapshot(); const context = runtime.context();
  const dashboard = useQuery(readOptions(runtime, "getOwnDriverDashboard", "driver:self:read", "driver", { path: { session_id: context.identity.session.session_id } }));
  const routes = useQuery({ queryKey: ["session", context.identity.session.session_id, context.identity.session.generation, context.identity.participant.participant_id, "driver-routes"],
    queryFn: ({ signal }) => runtime.reports.driverRoutes(signal), enabled: dashboard.isSuccess });
  return <DriverWorkspace context={context} resource={resourceOf(dashboard)} routes={routes.isError ? { status: "error", message: failureText(routes.error) } :
    routes.data ? { status: "ready", data: routes.data.routes } : { status: "loading" }} />;
}
export function ContributorRoute() {
  const runtime = useRuntime(); useRuntimeSnapshot(); const context = runtime.context();
  const dashboard = useQuery(readOptions(runtime, "getOwnContributorDashboard", "contributor:self:read", "contributor", { path: { session_id: context.identity.session.session_id } }));
  return <ContributorWorkspace context={context} resource={resourceOf(dashboard)} />;
}
export function DispatcherRoute() {
  const runtime = useRuntime(); useRuntimeSnapshot(); const { session } = runtime.context().identity;
  const snapshot = useQuery(readOptions(runtime, "getSessionSnapshot", "operations:read", "dispatcher", { path: { session_id: session.session_id } }));
  return <main><h1>Điều phối</h1><ResourceView resource={resourceOf(snapshot)}>{data => <>
    <Card title="Trạng thái vận hành server"><p>Phút {data.clock.now_minute} · Graph {data.graph_hash}</p>
      {data.operations.branches.map(branch => <p key={branch.branch_id}>{branch.branch_id}: {branch.orders.length} đơn · {branch.drivers.length} xe</p>)}
      <p>Kế hoạch mới nhất: {data.latest_plan ? <Link to={`../plans/${data.latest_plan.plan_id}`}>{data.latest_plan.plan_id}</Link> : "Chưa có"}</p>
    </Card><Alert title="Dữ liệu server">Màn này hiện snapshot theo quyền. Bản đồ và luồng business đầy đủ cần kiểm chứng tiếp trên backend đã tích hợp.</Alert>
  </>}</ResourceView></main>;
}
export function PlanListRoute() {
  const runtime = useRuntime(); useRuntimeSnapshot(); const { session } = runtime.context().identity;
  const query = useQuery(readOptions(runtime, "listPlans", "operations:read", "dispatcher", { path: { session_id: session.session_id } }));
  return <main><h1>Kế hoạch server</h1><ResourceView resource={resourceOf(query)}>{data => <ul>{data.items.map(plan =>
    <li key={plan.plan_id}><Link to={plan.plan_id}>{plan.plan_id}</Link> · {plan.status} · Projected</li>)}</ul>}</ResourceView></main>;
}
export function ReportsListRoute() {
  const runtime = useRuntime(); useRuntimeSnapshot(); const { session } = runtime.context().identity;
  const query = useQuery(readOptions(runtime, "listReports", "reports:review", "dispatcher", { path: { session_id: session.session_id } }));
  return <main><h1>Review báo cáo</h1><ResourceView resource={resourceOf(query)}>{data => <ul>{data.items.map(report =>
    <li key={report.report_id}><Link to={report.report_id}>{report.report_id}</Link> · {report.status}</li>)}</ul>}</ResourceView></main>;
}
export function useResourceParams() {
  const params = useParams(); if (!params.sessionId) throw new Error("Missing session route"); return params;
}
export function failedResource<T>(message: string): Resource<T> { return { status: "error", message }; }

export function ResultsRoute() {
  const runtime = useRuntime(); useRuntimeSnapshot(); const { session } = runtime.context().identity;
  const query = useQuery(readOptions(runtime, "getResults", "results:read", "dispatcher", { path: { session_id: session.session_id } }));
  return <main><h1>Kết quả từ server</h1><ResourceView resource={resourceOf(query)}>{data => <>
    <p>{data.label} · H={data.horizon_minute} · Observed={data.observed_until_minute} · Calibration {data.calibration_status}</p>
    {data.branches.map(branch => <Card key={branch.branch_id} title={branch.branch_id}><p>{branch.completed_at_horizon ? "Đã tới H" : "Chưa tới H"}</p>
      <dl>{Object.entries(branch.metrics).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl></Card>)}
    <p>Late reduction: {data.late_reduction_ratio === null ? "Chưa xác định" : data.late_reduction_ratio}</p>
  </>}</ResourceView></main>;
}
