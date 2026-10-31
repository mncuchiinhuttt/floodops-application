import { Hono } from "hono";
import { parseSchema } from "@floodops/contracts";
import { invoke, jsonBody, runtimeCall, send } from "../../../shared/index";
import type { AppEnv } from "../../../shared/index";
import type { Award } from "@floodops/contracts";
import { paginateAwards } from "../../rewards/pagination";
import { REVIEW_ACCEPT, REVIEW_REJECT, REVIEW_RESOLVE, REVIEW_AWARDS } from "./runtime-types";

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
  router.get("/sessions/:session_id/awards", async c => {
    const reply = await invoke(c, runtimeCall(c, "view", { name: REVIEW_AWARDS }));
    if (reply.status !== 200) return send(c, reply);
    const awards = (reply.body.data as { awards: Award[] }).awards;
    const data = await paginateAwards(awards, c.req.query(), reply.body.meta, c.env.SESSION_LOCATOR_KEY);
    return send(c, { ...reply, body: { ...reply.body, data } }, "listAwards");
  });
  return router;
}
