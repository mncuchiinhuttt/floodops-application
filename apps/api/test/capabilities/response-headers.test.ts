import { afterEach, describe, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { createApp } from "../../src/app";
import { scenarioReference } from "../../src/index";
import { requestKey } from "./helpers";
import { activeStreamCount, composed, createComposed, emitComposedEvent, finishStream, memberHeaders, webOrigin } from "./composed-http-fixtures";
afterEach(reset);
function security(response: Response): void {
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  expect(response.headers.get("Cache-Control")).toBe("no-store, no-transform");
  expect(response.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
  expect(response.headers.get("Content-Security-Policy")).toContain("object-src 'none'");
  expect(Boolean(response.headers.get("X-Request-ID"))).toBe(true);
}
function cors(response: Response): void {
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe(webOrigin);
  expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  expect(response.headers.get("Access-Control-Expose-Headers")).toBe("ETag, X-Request-ID, Retry-After");
  expect(response.headers.get("Vary")?.split(/,\s*/)).toContain("Origin");
}
describe("composed HTTP response security and CORS", () => {
  it("preserves middleware headers and the canonical allowed-Origin health body", async () => {
    const r = await composed("/health", { headers: { Origin: webOrigin } }); expect(r.status).toBe(200); security(r); cors(r);
    expect(r.headers.get("Content-Type")).toBe("application/json");
    const body = parseSchema("HealthResponse", await r.json()); expect(body.data?.status).toBe("ok");
    expect(r.headers.get("X-Request-ID")).toBe(body.meta.request_id);
  });
  it("permits native bearer requests without adding Origin authority", async () => {
    const owner = await createComposed(); const r = await composed(`/sessions/${owner.id}/identity`, { headers: memberHeaders(owner) });
    expect(r.status).toBe(200); security(r); expect(r.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(r.headers.get("Access-Control-Allow-Credentials")).toBeNull();
    expect(parseSchema("IdentityResponse", await r.json()).data?.participant.participant_id).toBe(owner.participant);
    expect(r.headers.get("ETag")).toBe(owner.etag);
  });
  it("returns a usable exact-Origin credentialed preflight and readable web identity", async () => {
    const preflight = await composed("/sessions", { method: "OPTIONS", headers: { Origin: webOrigin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "Content-Type, Idempotency-Key, X-CSRF-Token" } });
    expect(preflight.status).toBe(204); security(preflight); cors(preflight); expect(await preflight.text()).toBe("");
    expect(preflight.headers.get("Access-Control-Allow-Methods")?.split(/,\s*/)).toContain("POST");
    expect(preflight.headers.get("Access-Control-Allow-Headers")).toContain("X-CSRF-Token");
    const owner = await createComposed("web"); const r = await composed(`/sessions/${owner.id}/identity`, { headers: memberHeaders(owner) });
    expect(r.status).toBe(200); security(r); cors(r); expect(r.headers.get("ETag")).toBe(owner.etag);
    expect(parseSchema("IdentityResponse", await r.json()).data?.csrf_token === owner.csrf).toBe(true);
  });
  it.each(["GET", "OPTIONS"])("rejects bad Origin on %s without credentialed CORS", async method => {
    const r = await composed("/health", { method, headers: { Origin: "https://untrusted.invalid" } }); expect(r.status).toBe(403); security(r);
    expect(r.headers.get("Access-Control-Allow-Origin")).toBeNull(); expect(r.headers.get("Access-Control-Allow-Credentials")).toBeNull();
    expect(r.headers.get("Access-Control-Expose-Headers")).toBeNull(); expect(parseSchema("ErrorResponse", await r.json()).error.code).toBe("FORBIDDEN");
  });
  it("keeps 401, 404 and 503 JSON errors readable only by the approved Origin", async () => {
    const owner = await createComposed();
    const cases: [string, number, Record<string, string>][] = [[`/sessions/${owner.id}/identity`, 401, {}], ["/unknown", 404, {}], [`/sessions/${owner.id}/snapshot`, 503, memberHeaders(owner)]];
    for (const [path, status, headers] of cases) {
      const r = await composed(path, { headers: { ...headers, Origin: webOrigin } }); expect(r.status).toBe(status); security(r); cors(r);
      expect(r.headers.get("Content-Type")).toBe("application/json"); const body = parseSchema("ErrorResponse", await r.json());
      expect(r.headers.get("X-Request-ID")).toBe(body.meta.request_id);
    }
  });
  it("does not turn CORS approval into a CSRF bypass", async () => {
    const owner = await createComposed("web"); const headers = memberHeaders(owner, { "Content-Type": "application/json", "Idempotency-Key": requestKey() }); delete headers["X-CSRF-Token"];
    const r = await composed(`/sessions/${owner.id}/invitations`, { method: "POST", headers, body: JSON.stringify({ role: "viewer", bound_entity_id: null, expires_in_seconds: 60 }) });
    expect(r.status).toBe(403); security(r); cors(r); expect(parseSchema("ErrorResponse", await r.json()).error.code).toBe("FORBIDDEN");
  });
  it("retains web Set-Cookie and clears it on an empty 204 logout", async () => {
    const body = { scenario_id: scenarioReference.scenario_id, scenario_version: scenarioReference.scenario_version, client_type: "web" };
    const created = await composed("/sessions", { method: "POST", headers: { Origin: webOrigin, "Content-Type": "application/json", "Idempotency-Key": requestKey(), "X-Client-Request-Scope": requestKey(), "CF-Connecting-IP": "192.0.2.5" }, body: JSON.stringify(body) });
    expect(created.status).toBe(201); security(created); cors(created);
    const cookie = created.headers.get("Set-Cookie") ?? "";
    expect(["HttpOnly", "Secure", "SameSite=Lax", "Path=/"].every(value => cookie.includes(value))).toBe(true);
    const data = parseSchema("SessionCreatedResponse", await created.json()).data!; expect(data.credential.access_token).toBeNull();
    const logout = await composed(`/sessions/${data.session.session_id}/logout`, { method: "POST", headers: { Origin: webOrigin, Cookie: cookie.split(";")[0]!, "X-CSRF-Token": data.credential.csrf_token!, "Idempotency-Key": requestKey() } });
    expect(logout.status).toBe(204); security(logout); cors(logout); expect(await logout.text()).toBe("");
    expect(logout.headers.get("Content-Type")).toBeNull(); expect(logout.headers.get("Set-Cookie")?.includes("Max-Age=0")).toBe(true);
  });
  it("preserves cached reply request ID and ETag on idempotent HTTP replay", async () => {
    const options = { method: "POST", headers: { Origin: webOrigin, "Content-Type": "application/json", "Idempotency-Key": requestKey(), "X-Client-Request-Scope": requestKey(), "CF-Connecting-IP": "192.0.2.6" },
      body: JSON.stringify({ scenario_id: scenarioReference.scenario_id, scenario_version: scenarioReference.scenario_version, client_type: "native" }) };
    const first = await composed("/sessions", options); const body = parseSchema("SessionCreatedResponse", await first.json());
    const replay = await composed("/sessions", options); expect(replay.status).toBe(201); security(replay); cors(replay);
    const replayBody = parseSchema("SessionCreatedResponse", await replay.json());
    expect(replayBody.meta.request_id).toBe(body.meta.request_id); expect(replay.headers.get("X-Request-ID")).toBe(body.meta.request_id);
    expect(replay.headers.get("ETag")).toBe(first.headers.get("ETag"));
  });
  it("retains truthful Retry-After and exposed headers on a real quota response", async () => {
    for (let i = 0; i < 10; i++) await createComposed("native", "192.0.2.7");
    const r = await composed("/sessions", { method: "POST", headers: { Origin: webOrigin, "Content-Type": "application/json", "Idempotency-Key": requestKey(), "X-Client-Request-Scope": requestKey(), "CF-Connecting-IP": "192.0.2.7" }, body: JSON.stringify({ scenario_id: scenarioReference.scenario_id, scenario_version: scenarioReference.scenario_version, client_type: "native" }) });
    expect(r.status).toBe(429); security(r); cors(r); expect(Number(r.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(parseSchema("ErrorResponse", await r.json()).error.code).toBe("RATE_LIMITED");
  });
  it("sanitizes unexpected loader exceptions while keeping policy headers", async () => {
    const app = createApp([], { loadScenario: async () => { throw new Error("Synthetic private failure detail"); } });
    const r = await composed("/sessions", { method: "POST", headers: { Origin: webOrigin, "Content-Type": "application/json", "Idempotency-Key": requestKey(), "X-Client-Request-Scope": requestKey(), "CF-Connecting-IP": "192.0.2.8" }, body: JSON.stringify({ scenario_id: scenarioReference.scenario_id, scenario_version: scenarioReference.scenario_version, client_type: "native" }) }, app);
    expect(r.status).toBe(503); security(r); cors(r); expect(await r.text()).not.toContain("Synthetic private failure detail");
  });
  it.each(["web", "native"] as const)("preserves SSE body/type and policy headers for %s", async type => {
    const owner = await createComposed(type); await emitComposedEvent(owner);
    const r = await composed(`/sessions/${owner.id}/events/stream?after=0`, { headers: memberHeaders(owner) });
    expect(r.status).toBe(200); security(r); if (type === "web") cors(r); else expect(r.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(r.headers.get("Content-Type")).toBe("text/event-stream"); expect(r.headers.get("X-Accel-Buffering")).toBe("no");
    const reader = r.body!.getReader();
    try { expect(new TextDecoder().decode((await reader.read()).value)).toContain("event: capability_revoked"); } finally { await reader.cancel(); await finishStream(r); }
    expect(await activeStreamCount(owner)).toBe(0);
  });
});
