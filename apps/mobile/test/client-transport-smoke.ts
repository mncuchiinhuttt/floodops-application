/** Executable synthetic-transport smoke. No backend/model/native-device evidence is implied. */
import { createNativeApi, NativeSessionClient } from "../src/shared/native-client";
import { fixtureContext, fixtureDriver } from "../preview/fixture-data";
import { DriverDashboardSchema, PlanSchema, ContributorDashboardSchema, ReportSchema, ImageReviewJobSchema, ResultsSchema } from "@floodops/contracts";
import { fixtureContributor, fixtureJob, fixturePlan, fixtureReport, fixtureResults } from "../preview/fixture-data";
const dashboard = DriverDashboardSchema.parse(fixtureDriver());
PlanSchema.parse(fixturePlan()); ContributorDashboardSchema.parse(fixtureContributor());
ReportSchema.parse(fixtureReport()); ImageReviewJobSchema.parse(fixtureJob()); ResultsSchema.parse(fixtureResults());
const context = { ...fixtureContext("driver"), online: true };
let requests = 0;
const api = createNativeApi("https://fixture.invalid/api/v1", { readToken: async sessionId => {
  if (sessionId !== context.session.session_id) throw new Error("Wrong credential scope");
  return "synthetic-test-capability-for-transport-only";
} }, async (url, init) => {
  requests++;
  if (!url.endsWith("/drivers/me") || init.method !== "GET") throw new Error("Wrong authorized request");
  if (!new Headers(init.headers).get("Authorization")?.startsWith("Bearer ")) throw new Error("Missing native auth");
  return Response.json({ success: true, data: dashboard, error: null, meta: { request_id: "native-smoke", session_id: context.session.session_id, generation: 1, revision: 3, event_sequence: 5 } },
    { headers: { ETag: '"s:ses_fixture01:g:1:r:3"' } });
});
const session = new NativeSessionClient(api, context);
const result = await session.driverDashboard();
if (result.body.data.driver_id !== dashboard.driver_id || result.version?.revision !== 3) throw new Error("Invalid public client result");
session.invalidate();
try { await session.driverDashboard(); throw new Error("Invalidated request executed"); }
catch (error) { if (!(error instanceof Error) || !error.message.includes("Rejoin")) throw error; }
if (requests !== 1) throw new Error("Unexpected request count");
console.log("PASS: public native client -> C1 request/response validation -> scoped dashboard -> cancellation; synthetic transport only.");
