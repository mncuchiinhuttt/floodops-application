import { Hono } from "hono";
import { parseSchema } from "@floodops/contracts";
import { createSessionRuntimeClient, fail, invoke, jsonBody, runtimeCall, send } from "../../shared/index";
import type { AppEnv } from "../../shared/index";
import { EVAL_START, EVAL_VIEW } from "./runtime-types";

export function createEvaluationRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  router.post("/sessions/:session_id/evaluation-runs", async c => {
    const call = runtimeCall(c, "command", { name: EVAL_START, payload: parseSchema("EvaluationInput", await jsonBody(c.req.raw)) });
    const reply = await invoke(c, call);
    if (reply.status !== 200) return send(c, reply);
    // Duplicate start replays are fenced by EVAL_BEGIN; the DO delays its own driver for the 202 response.
    await createSessionRuntimeClient(c.env).startDriver("evaluation", call, reply);
    return send(c, { ...reply, status: 202 }, "createEvaluationRun");
  });
  router.get("/sessions/:session_id/evaluation-runs/:evaluation_id", async c => {
    const id = parseSchema("Id", c.req.param("evaluation_id")), reply = await invoke(c, runtimeCall(c, "view", { name: EVAL_VIEW }));
    if (reply.status !== 200) return send(c, reply);
    if (!Array.isArray(reply.body.data)) fail(503, "CONFIG_INCOMPLETE");
    const run = reply.body.data.find(item => item.evaluation_id === id);
    if (!run) fail(404, "NOT_FOUND");
    return send(c, { ...reply, body: { ...reply.body, data: run } }, "getEvaluationRun");
  });
  return router;
}
