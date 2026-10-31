import { Hono } from "hono";
import { parseSchema } from "@floodops/contracts";
import type { AdvanceJob } from "@floodops/contracts";
import { createSessionRuntimeClient, fail, invoke, jsonBody, runtimeCall, send } from "../../shared/index";
import type { AppEnv, Reply } from "../../shared/index";
import { driveAdvance } from "./advance-service";
import { ADVANCE_START, CLOCK_VIEW, JOBS_VIEW } from "./runtime-types";
import type { AdvanceReservation } from "./runtime-types";

export function createSimulationRouter(maxChunks: number): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  router.get("/sessions/:session_id/simulation", async c => send(c,
    await invoke(c, runtimeCall(c, "view", { name: CLOCK_VIEW })), "getSimulationClock"));
  router.get("/sessions/:session_id/simulation/advances/:advance_job_id", async c => {
    const id = parseSchema("Id", c.req.param("advance_job_id"));
    const reply = await invoke(c, runtimeCall(c, "view", { name: JOBS_VIEW }));
    if (reply.status !== 200) return send(c, reply);
    const job = (reply.body.data as AdvanceJob[]).find(job => job.advance_job_id === id);
    if (!job) fail(404, "NOT_FOUND");
    return send(c, { ...reply, body: { ...reply.body, data: job } }, "getAdvanceJob");
  });
  router.post("/sessions/:session_id/simulation/advances", async c => {
    const call = runtimeCall(c, "command", { name: ADVANCE_START, payload: parseSchema("AdvanceInput", await jsonBody(c.req.raw)) });
    const reply = await invoke(c, call);
    if (reply.status !== 200) return send(c, reply);
    const publicReply: Reply = { ...reply, status: 202, body: { ...reply.body, data: (reply.body.data as AdvanceReservation).job } };
    c.executionCtx.waitUntil(driveAdvance(createSessionRuntimeClient(c.env).dispatch, call, reply, maxChunks));
    return send(c, publicReply, "advanceSimulation");
  });
  return router;
}
