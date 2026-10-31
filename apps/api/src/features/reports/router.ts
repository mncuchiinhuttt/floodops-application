import { Hono } from "hono";
import { parseSchema } from "@floodops/contracts";
import type { StoredSourceReport } from "@floodops/domain/reporting";
import type { AppEnv } from "../../shared/index";
import { fail } from "../../shared/index";
import { invoke, jsonBody, runtimeCall, send } from "../../app/index";
import { mapped, page, requestKey, resourceId, stableId, successful, view } from "../scenario/index";
import { verifiedFixture } from "../media/index";
interface ReportProjection { participantId: string; generation: number; records: StoredSourceReport[] }
export function createReportsRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  router.post("/sessions/:session_id/reports", async c => {
    const key = requestKey(c), input = parseSchema("SubmitReportInput", await jsonBody(c.req.raw));
    const identity = await invoke(c, runtimeCall(c, "identity")); if (identity.status >= 400) return send(c, identity);
    const participant = (identity.body.data as { participant: { participant_id: string } }).participant.participant_id;
    const reportId = await stableId("report", [resourceId(c, "session_id"), participant, key]);
    const permission = await invoke(c, runtimeCall(c, "command", { name: "source-authorize-report", key: await stableId("auth", [key, "report"]), payload: { input, reportId } }));
    if (permission.status >= 400) return send(c, permission);
    let fixtureDigest: string | null = null;
    if (input.kind === "citizen" && input.fixture_photo_id) {
      const stored = await view(c, "source-reports"); if (stored.status >= 400) return send(c, stored);
      const existing = (stored.body.data as ReportProjection).records.find(item => item.report.report_id === reportId);
      fixtureDigest = existing?.normalizedDigest ?? (await verifiedFixture(c.env, runtimeCall(c, "view", { name: "source-fixture-assets" }), input.fixture_photo_id)).sha256;
    }
    const reply = await invoke(c, runtimeCall(c, "command", { name: "source-submit-report", key, payload: { input, fixtureDigest,
      reportId } }));
    return send(c, successful(reply, 201), "submitReport");
  });
  router.get("/sessions/:session_id/reports", async c => {
    const reply = await view(c, "source-reports");
    return mapped(c, reply, "listReports", data => {
      const projection = data as ReportProjection;
      return page(c, projection.records.map(item => item.report), JSON.stringify([reply.body.meta.session_id, projection.generation, projection.participantId, "reports"]));
    });
  });
  router.get("/sessions/:session_id/reports/:report_id", async c => mapped(c, await view(c, "source-reports"), "getReport", data => {
    const report = (data as ReportProjection).records.find(item => item.report.report_id === resourceId(c, "report_id"))?.report;
    if (!report) fail(404, "NOT_FOUND"); return report;
  }));
  return router;
}
