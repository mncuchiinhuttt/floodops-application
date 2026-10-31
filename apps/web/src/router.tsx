import { createBrowserRouter, createMemoryRouter, Link, Outlet, redirect, useRevalidator, useRouteError, type LoaderFunctionArgs, type RouteObject } from "react-router";
import { IdSchema, type Permission, type Role } from "@floodops/contracts";
import { Alert, Button, Skeleton } from "@floodops/ui-web";
import { accessReason } from "./shared/access";
import { FeatureAccessError } from "./shared/client-context";
import { WebRuntime } from "./app/runtime";
import { failureText } from "./app/failure";
import { SessionCommands } from "./features/session/runtime/commands";
import { JoinPage, joinAction } from "./features/session/runtime/join-page";
import { SessionShell } from "./features/session/runtime/session-shell";
import { SessionPage } from "./features/session/runtime/session-page";

export function RouteFailure() {
  const error = useRouteError(), revalidator = useRevalidator();
  return <main><Alert title="Không mở được màn hình">{failureText(error)}</Alert>
    <Button onClick={() => void revalidator.revalidate()}>Thử tải lại</Button><Link to="/">Ghép nối / mở lại phiên</Link></main>;
}
export function createRoutes(runtime: WebRuntime, commands = new SessionCommands(runtime)): RouteObject[] {
  const authorized = (permission: Permission, role: Role) => async ({ params, request }: LoaderFunctionArgs) => {
    const sessionId = IdSchema.parse(params.sessionId); await runtime.ensureIdentity(sessionId, request.signal);
    const reason = accessReason(runtime.context(), permission, role); if (reason) throw new FeatureAccessError(reason);
    if (params.planId) IdSchema.parse(params.planId); if (params.reportId) IdSchema.parse(params.reportId);
    return null;
  };
  return [{ element: <Outlet />, errorElement: <RouteFailure />, HydrateFallback: () => <Skeleton label="Đang mở phiên" />, children: [
    { path: "/", element: <JoinPage />, action: joinAction(commands) },
    { path: "/sessions/:sessionId", element: <SessionShell />, errorElement: <RouteFailure />,
      loader: async ({ params, request }) => runtime.ensureIdentity(IdSchema.parse(params.sessionId), request.signal, true), children: [
        { index: true, loader: async ({ params, request }) => {
          const identity = await runtime.ensureIdentity(IdSchema.parse(params.sessionId), request.signal);
          const destination = identity.participant.role === "driver" ? "driver" : identity.participant.role === "contributor" ? "community/reports" : identity.participant.role === "dispatcher" ? "dispatch/map" : "session";
          return redirect(`/sessions/${identity.session.session_id}/${destination}`);
        } },
        { path: "session", element: <SessionPage commands={commands} /> },
        { path: "driver", loader: authorized("driver:self:read", "driver"), lazy: async () => ({ Component: (await import("./app/workspaces")).DriverRoute }) },
        { path: "driver/report", loader: authorized("reports:submit", "driver"), lazy: async () => ({ Component: (await import("./app/report-submit-route")).DriverReportRoute }) },
        { path: "community/reports", loader: authorized("contributor:self:read", "contributor"), lazy: async () => ({ Component: (await import("./app/workspaces")).ContributorRoute }) },
        { path: "community/points", loader: authorized("contributor:self:read", "contributor"), lazy: async () => ({ Component: (await import("./app/workspaces")).ContributorRoute }) },
        { path: "community/new", loader: authorized("reports:submit", "contributor"), lazy: async () => ({ Component: (await import("./app/report-submit-route")).CitizenReportRoute }) },
        { path: "dispatch/report", loader: authorized("simulation:submit_as", "dispatcher"), lazy: async () => ({ Component: (await import("./app/report-submit-route")).CitizenReportRoute }) },
        { path: "dispatch/map", loader: authorized("operations:read", "dispatcher"), lazy: async () => ({ Component: (await import("./app/workspaces")).DispatcherRoute }) },
        { path: "dispatch/results", loader: authorized("results:read", "dispatcher"), lazy: async () => ({ Component: (await import("./app/workspaces")).ResultsRoute }) },
        { path: "dispatch/plans", loader: authorized("operations:read", "dispatcher"), lazy: async () => ({ Component: (await import("./app/workspaces")).PlanListRoute }) },
        { path: "dispatch/plans/:planId", loader: authorized("operations:read", "dispatcher"), lazy: async () => ({ Component: (await import("./app/plan-route")).PlanRoute }) },
        { path: "dispatch/reports", loader: authorized("reports:review", "dispatcher"), lazy: async () => ({ Component: (await import("./app/workspaces")).ReportsListRoute }) },
        { path: "dispatch/reports/:reportId", loader: authorized("reports:review", "dispatcher"), lazy: async () => ({ Component: (await import("./app/report-route")).ReviewRoute }) },
      ] },
    { path: "*", element: <main><h1>Không có màn hình này</h1><Link to="/">Ghép nối phiên</Link></main> },
  ] }];
}
export function createApplication(runtime = new WebRuntime(), initialEntries?: string[]) {
  const commands = new SessionCommands(runtime), routes = createRoutes(runtime, commands);
  return { runtime, commands, router: initialEntries ? createMemoryRouter(routes, { initialEntries }) : createBrowserRouter(routes) };
}
