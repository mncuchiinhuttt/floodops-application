import { Hono } from "hono";
import { parseSchema } from "@floodops/contracts";
import { hash, hmac, stable, validateKey } from "../../shared/crypto";
import { fail, PlatformError } from "../../shared/platform-error";
import { isWebOrigin } from "../../shared/web-origin";
import type { AppEnv, PlatformPorts } from "../../shared/platform-types";
import { issueCredentials } from "../../session-runtime/credentials";
import { MAX_AGE_MS } from "../../session-runtime/auth";
import { jsonBody, key, send } from "../../app/http";
export function createCreationRouter(ports: PlatformPorts): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  router.post("/sessions", async c => {
    const input = parseSchema("CreateSessionInput", await jsonBody(c.req.raw));
    const requestKey = key(c); const scope = validateKey(c.req.header("X-Client-Request-Scope"));
    if (scope.length < 32) fail(422, "INVALID_SCHEMA");
    const origin = c.req.header("Origin");
    if ((origin && !isWebOrigin(c.env.WEB_ORIGIN, origin)) || (input.client_type === "web" && !isWebOrigin(c.env.WEB_ORIGIN, origin))) fail(403, "FORBIDDEN");
    const locator = await hmac(c.env.SESSION_LOCATOR_KEY, [c.env.APP_ENV, scope, requestKey]);
    const sessionId = `session_${locator}`;
    const address = ports.clientAddress?.(c.req.raw) ?? c.req.header("CF-Connecting-IP");
    if (!address) fail(503, "CONFIG_INCOMPLETE");
    const now = Date.now(); const bucket = String(Math.floor(now / 3600000));
    const limiterId = await hmac(c.env.SESSION_LOCATOR_KEY, ["create-limit", c.env.APP_ENV, address, bucket]);
    const limiter = c.env.SESSIONS.get(c.env.SESSIONS.idFromName(`create_${limiterId}`));
    const retryAfter = Math.ceil((3600000 - now % 3600000) / 1000);
    if (!await limiter.limitCreate(bucket, locator, retryAfter)) throw new PlatformError(429, "RATE_LIMITED", "Session creation limit", undefined, retryAfter);
    const seed = await ports.loadScenario(input.scenario_id, input.scenario_version);
    if (seed.scenario_id !== input.scenario_id || seed.scenario_version !== input.scenario_version) fail(503, "CONFIG_INCOMPLETE");
    const digest = await hash(stable(input));
    const credentials = await issueCredentials(c.env, sessionId, requestKey, digest, "dispatcher", null, true, input.client_type, now + MAX_AGE_MS);
    const reply = JSON.parse(await c.env.SESSIONS.get(c.env.SESSIONS.idFromName(sessionId)).install(JSON.stringify({ sessionId, generation: 0, seed, credentials,
      key: requestKey, digest, marker: locator, requestId: c.get("requestId"), now }))) as import("../../shared/platform-types").Reply;
    return send(c, reply, "createSession");
  });
  router.post("/session-claims", async c => {
    const input = parseSchema("ClaimInput", await jsonBody(c.req.raw));
    const reply = JSON.parse(await c.env.SESSIONS.get(c.env.SESSIONS.idFromName(input.session_id)).dispatch(JSON.stringify({ kind: "claim", sessionId: input.session_id,
      requestId: c.get("requestId"), key: key(c), path: "/api/v1/session-claims", payload: input,
      auth: { token: "", transport: "cookie", origin: c.req.header("Origin") ?? null, csrf: null } }))) as import("../../shared/platform-types").Reply;
    return send(c, reply, "claimSession");
  });
  return router;
}
