import { Hono } from "hono";
import { randomId } from "../shared/crypto";
import { fail, success } from "../shared/platform-error";
import type { AppEnv, PlatformPorts } from "../shared/platform-types";
import { createSessionRouter } from "../features/session/router";
import { failure, send } from "./http";
export function createApp(featureRouters: Hono<AppEnv>[], ports: PlatformPorts): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.use("*", async (c, next) => {
    c.set("requestId", randomId("request"));
    c.header("Cache-Control", "no-store, no-transform"); c.header("X-Content-Type-Options", "nosniff");
    c.header("Referrer-Policy", "no-referrer"); c.header("X-Request-ID", c.get("requestId"));
    c.header("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'; object-src 'none'");
    const origin = c.req.header("Origin");
    if (origin && origin !== c.env.WEB_ORIGIN) fail(403, "FORBIDDEN");
    if (origin === c.env.WEB_ORIGIN) {
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
  app.onError((error, c) => failure(c, error));
  app.get("/api/v1/health", c => send(c, success(200, { status: "ok", version: "0.0.0", environment: c.env.APP_ENV === "production" ? "production" : c.env.APP_ENV === "preview" ? "preview" : "development" }, c.get("requestId")), "getHealth"));
  app.route("/api/v1", createSessionRouter(ports));
  for (const router of featureRouters) app.route("/api/v1", router);
  app.notFound(c => { try { fail(404, "NOT_FOUND"); } catch (error) { return failure(c, error); } });
  return app;
}
