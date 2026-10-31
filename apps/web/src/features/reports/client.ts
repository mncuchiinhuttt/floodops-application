import type { SubmitReportInput, ReviewInput } from "@floodops/contracts";
import { FeatureAccessError, type BoundClient } from "../../shared/client-context";

export function createReportClient(client: BoundClient) {
  return {
    driverDashboard: () => client.read("getOwnDriverDashboard", "driver:self:read", "driver", { path: { session_id: client.sessionId() } }),
    driverRoutes: async () => {
      const dashboard = await client.read("getOwnDriverDashboard", "driver:self:read", "driver", { path: { session_id: client.sessionId() } });
      const routes = await Promise.all(dashboard.body.data.route_ids.map(routeId => client.read("getRoute", "driver:self:read", "driver", {
        path: { session_id: dashboard.body.data.session.session_id, route_id: routeId },
      })));
      for (const route of routes) if (route.body.data.driver_id !== dashboard.body.data.driver_id ||
        route.body.meta.generation !== dashboard.body.meta.generation || route.body.meta.revision !== dashboard.body.meta.revision)
        throw new FeatureAccessError("Tuyến không còn khớp dashboard. Làm mới trước khi xem.");
      return { dashboard, routes: routes.map(route => route.body.data) };
    },
    contributorDashboard: () => client.read("getOwnContributorDashboard", "contributor:self:read", "contributor", { path: { session_id: client.sessionId() } }),
    submit: (body: SubmitReportInput, key: string) => client.prepare("submitReport", "reports:submit",
      body.kind === "driver" ? "driver" : "contributor", context => ({
        path: { session_id: context.identity.session.session_id }, headers: client.headers(context, key), body,
      })),
    review: (reportId: string, body: ReviewInput, key: string) => client.prepare("reviewReport", "reports:review", "dispatcher", context => ({
      path: { session_id: context.identity.session.session_id, report_id: reportId }, headers: client.headers(context, key), body,
    })),
    imageReview: (reportId: string) => client.read("getReportImageReview", "reports:review", "dispatcher", {
      path: { session_id: client.sessionId(), report_id: reportId },
    }),
    requestImageReview: (reportId: string, key: string) => client.prepare("createReportImageReview", "reports:review", "dispatcher", context => ({
      path: { session_id: context.identity.session.session_id, report_id: reportId }, headers: { "Idempotency-Key": key }, body: {},
    })),
  };
}
