import { Hono } from "hono";
import { parseSchema } from "@floodops/contracts";
import type { AppEnv, PlatformPorts } from "../../shared/platform-types";
import { invoke, jsonBody, key, runtimeCall, send } from "../../app/http";
import { createCreationRouter } from "./creation";
import { streamEvents } from "./stream";
export function createSessionRouter(ports: PlatformPorts): Hono<AppEnv> {
  const router = new Hono<AppEnv>(); router.route("/", createCreationRouter(ports));
  router.get("/sessions/:session_id", async c => send(c, await invoke(c, runtimeCall(c, "meta")), "getSession"));
  router.get("/sessions/:session_id/identity", async c => send(c, await invoke(c, runtimeCall(c, "identity")), "getIdentity"));
  router.get("/sessions/:session_id/participants", async c => {
    const q = c.req.query();
    return send(c, await invoke(c, runtimeCall(c, "participants", { payload: { ...q, ...(q.limit !== undefined ? { limit: Number(q.limit) } : {}) } })), "listParticipants");
  });
  router.post("/sessions/:session_id/invitations", async c => send(c, await invoke(c, runtimeCall(c, "invite", {
    key: key(c), payload: parseSchema("InviteInput", await jsonBody(c.req.raw)) })), "createInvitation"));
  router.delete("/sessions/:session_id/participants/:participant_id", async c => send(c, await invoke(c, runtimeCall(c, "revoke", {
    key: key(c), name: parseSchema("Id", c.req.param("participant_id")) })), "revokeParticipant"));
  router.post("/sessions/:session_id/logout", async c => send(c, await invoke(c, runtimeCall(c, "logout", { key: key(c) })), "logout"));
  router.delete("/sessions/:session_id", async c => send(c, await invoke(c, runtimeCall(c, "delete", { key: key(c) })), "deleteSession"));
  router.post("/sessions/:session_id/resets", async c => send(c, await invoke(c, runtimeCall(c, "reset", {
    key: key(c), payload: parseSchema("ResetInput", await jsonBody(c.req.raw)) })), "resetSession"));
  router.get("/sessions/:session_id/events", async c => {
    const query = c.req.query();
    const input = parseSchema("EventPage", { events: [], next_sequence: Number(query.after), has_more: false });
    if (!Object.keys(query).every(k => ["after", "limit"].includes(k)) || query.after === undefined) return send(c, { status: 422, body: { success: false, data: null, error: { code: "INVALID_SCHEMA", message: "Invalid event query", details: [], retryable: false, current_revision: null, replacement_session_id: null }, meta: { request_id: c.get("requestId") } } });
    return send(c, await invoke(c, runtimeCall(c, "events", { after: input.next_sequence, limit: query.limit ? Number(query.limit) : 50 })), "getEvents");
  });
  router.get("/sessions/:session_id/events/stream", streamEvents);
  const views = [ ["snapshot", "snapshot", "getSessionSnapshot"], ["overview", "overview", "getSessionOverview"],
    ["drivers/me", "driver-dashboard", "getOwnDriverDashboard"], ["contributors/me", "contributor-dashboard", "getOwnContributorDashboard"] ] as const;
  for (const [path, name, operation] of views) router.get(`/sessions/:session_id/${path}`, async c => send(c, await invoke(c, runtimeCall(c, "view", { name })), operation));
  return router;
}
