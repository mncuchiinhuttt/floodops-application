import { Hono } from "hono";
import { randomId } from "../shared/crypto";
import { routePath } from "hono/route";
import { fail, normalizeError, PlatformError, success } from "../shared/platform-error";
import type { AppContext, AppEnv, PlatformPorts } from "../shared/platform-types";
import { createSessionRouter } from "../features/session/router";
import { failure, send } from "./http";
import { logAppError } from "./error-log";
import { isWebOrigin } from "../shared/web-origin";
const API_CSP = "default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'";
function handleAppError(c: AppContext, error: unknown): Promise<Response> {
  const normalized = normalizeError(error);
  logAppError({ requestId: c.get("requestId"), operation: `${c.req.method} ${routePath(c, -1) || "unmatched"}`,
    status: normalized.status, errorCode: normalized.code });
  return failure(c, normalized);
}
export function createApp(featureRouters: Hono<AppEnv>[], ports: PlatformPorts): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.use("*", async (c, next) => {
    c.set("requestId", randomId("request"));
    c.header("Cache-Control", "no-store, no-transform"); c.header("X-Content-Type-Options", "nosniff");
    c.header("Referrer-Policy", "no-referrer"); c.header("X-Request-ID", c.get("requestId"));
    c.header("Content-Security-Policy", API_CSP);
    c.header("X-Frame-Options", "DENY");
    c.header("Cross-Origin-Opener-Policy", "same-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (new URL(c.req.url).protocol === "https:") c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    const origin = c.req.header("Origin");
    if (origin && !isWebOrigin(c.env.WEB_ORIGIN, origin)) fail(403, "FORBIDDEN");
    if (isWebOrigin(c.env.WEB_ORIGIN, origin)) {
      c.header("Access-Control-Allow-Origin", origin); c.header("Access-Control-Allow-Credentials", "true"); c.header("Vary", "Origin");
      c.header("Access-Control-Expose-Headers", "ETag, X-Request-ID, Retry-After");
    }
    if (c.req.method === "OPTIONS") {
      if (!origin) fail(403, "FORBIDDEN");
      c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      c.header("Access-Control-Allow-Headers", "Authorization, Content-Type, If-Match, Idempotency-Key, X-Client-Request-Scope, X-CSRF-Token, Last-Event-ID");
      return c.body(null, 204);
    }
    await next();
  });
  app.onError((error, c) => handleAppError(c, error));
  app.get("/api/v1/health", c => send(c, success(200, { status: "ok", version: "0.0.0", environment: c.env.APP_ENV === "production" ? "production" : c.env.APP_ENV === "preview" ? "preview" : "development" }, c.get("requestId")), "getHealth"));
  app.route("/api/v1", createSessionRouter(ports));
  for (const router of featureRouters) app.route("/api/v1", router);
  app.notFound(c => handleAppError(c, new PlatformError(404, "NOT_FOUND")));
  return app;
}
