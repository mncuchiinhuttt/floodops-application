import { Hono } from "hono";
import { parseOperationInput, parseSchema } from "@floodops/contracts";
import { fail, invoke, jsonBody, runtimeCall, send } from "../../../shared/index";
import type { AppContext, AppEnv } from "../../../shared/index";
import type { Award, Conflict, Gap } from "@floodops/contracts";
import { paginateReviewItems } from "../../rewards/pagination";
import { REVIEW_ACCEPT, REVIEW_REJECT, REVIEW_RESOLVE, REVIEW_AWARDS, REVIEW_CONFLICTS, REVIEW_GAPS, REVIEW_COVERAGE } from "./runtime-types";

/** View payloads cross the Durable Object as JSON; narrow instead of casting. */
function rows<T>(data: unknown): T[] { if (!Array.isArray(data)) fail(503, "CONFIG_INCOMPLETE"); return data; }
function awardRows(data: unknown): Award[] {
  if (!data || typeof data !== "object" || !("awards" in data)) fail(503, "CONFIG_INCOMPLETE");
  return rows<Award>(data.awards);
}
async function pagedView<T>(c: AppContext, name: string, purpose: string, operation: "listAwards" | "listConflicts" | "listGaps", items: (data: unknown) => T[]) {
  const reply = await invoke(c, runtimeCall(c, "view", { name }));
  if (reply.status !== 200) return send(c, reply);
  const data = await paginateReviewItems(items(reply.body.data), purpose, c.req.query(), reply.body.meta, c.env.SESSION_LOCATOR_KEY);
  return send(c, { ...reply, body: { ...reply.body, data } }, operation);
}

/** Only feature-owned review/resolution/award routes; report submission stays Sources-owned. */
export function createReviewRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  router.post("/sessions/:session_id/reports/:report_id/reviews", async c => {
    const report_id = parseSchema("Id", c.req.param("report_id")), input = parseSchema("ReviewInput", await jsonBody(c.req.raw));
    return send(c, await invoke(c, runtimeCall(c, "command", { name: input.decision === "accept" ? REVIEW_ACCEPT : REVIEW_REJECT,
      payload: { report_id, input } })), "reviewReport");
  });
  router.post("/sessions/:session_id/conflicts/:conflict_id/resolutions", async c => {
    const conflict_id = parseSchema("Id", c.req.param("conflict_id")), input = parseSchema("ConflictResolutionInput", await jsonBody(c.req.raw));
    return send(c, await invoke(c, runtimeCall(c, "command", { name: REVIEW_RESOLVE, payload: { conflict_id, input } })), "resolveConflict");
  });
  router.get("/sessions/:session_id/awards", c => pagedView(c, REVIEW_AWARDS, "review-awards-v1", "listAwards", awardRows));
  router.get("/sessions/:session_id/conflicts", c => pagedView(c, REVIEW_CONFLICTS, "review-conflicts-v1", "listConflicts", rows<Conflict>));
  router.get("/sessions/:session_id/gaps", c => pagedView(c, REVIEW_GAPS, "review-gaps-v1", "listGaps", rows<Gap>));
  router.get("/sessions/:session_id/coverage", async c => {
    parseOperationInput("getCoverage", { path: { session_id: c.req.param("session_id") }, query: c.req.query() });
    return send(c, await invoke(c, runtimeCall(c, "view", { name: REVIEW_COVERAGE })), "getCoverage");
  });
  return router;
}
