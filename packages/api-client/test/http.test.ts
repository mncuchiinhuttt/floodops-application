import { expect, test } from "bun:test";
import { ContractValidationError, formatEtag } from "@floodops/contracts";
import { ApiClient, ApiError, RequestScope, RequestCancelledError, TransportError,
  webCredentials, nativeCredentials, createIdempotencyKey } from "../src";
import { errorResponse, meta, response, sessionId, state } from "./fixtures";
const path = { session_id: sessionId, report_id: "report_test0001" };
const credentials = nativeCredentials(() => "synthetic-token-".repeat(3));
const baseUrl = "https://floodops.example/api/v1";
const developmentLanOrigin = "http://192.168.225.123:8790";
const developmentLanBaseUrl = `${developmentLanOrigin}/api/v1`;
test("HTTP LAN access requires an exact opted-in RFC1918 origin", () => {
  expect(new ApiClient({ baseUrl: developmentLanBaseUrl, developmentLanOrigin, credentials })).toBeInstanceOf(ApiClient);
  expect(() => new ApiClient({ baseUrl: developmentLanBaseUrl, credentials })).toThrow(ContractValidationError);
  for (const invalidOrigin of [
    "http://8.8.8.8:8790", "http://localhost:8790", "http://0.0.0.0:8790",
    "http://192.168.225.123", "http://user:pass@192.168.225.123:8790",
    "http://192.168.225.123:8790/api/v1", "http://192.168.225.123:8790?query=1",
    "http://192.168.225.123:8790#fragment", "http://169.254.1.1:8790", "http://[::1]:8790",
  ]) {
    expect(() => new ApiClient({ baseUrl: developmentLanBaseUrl, developmentLanOrigin: invalidOrigin, credentials })).toThrow(ContractValidationError);
  }
  for (const mismatchedBaseUrl of ["http://192.168.225.124:8790/api/v1", "http://192.168.225.123:8791/api/v1"]) {
    expect(() => new ApiClient({ baseUrl: mismatchedBaseUrl, developmentLanOrigin, credentials })).toThrow(ContractValidationError);
  }
});
test("HTTPS and loopback HTTP base URLs remain accepted without LAN opt-in", () => {
  expect(new ApiClient({ baseUrl, credentials })).toBeInstanceOf(ApiClient);
  expect(new ApiClient({ baseUrl: "http://127.0.0.1:8790/api/v1", credentials })).toBeInstanceOf(ApiClient);
});
test("GET retry bounded; bearer auth is header-only; no-store and redirect errors", async () => {
  const seen: RequestInit[] = [], waits: number[] = [];
  const client = new ApiClient({ baseUrl, credentials, random: () => 0, wait: async ms => { waits.push(ms); },
    fetch: async (url, init) => {
      expect(url).not.toContain("synthetic-token"); seen.push(init);
      if (seen.length < 3) throw new Error("lost transport");
      return response(state);
    } });
  expect((await client.request("getReportImageReview", { path })).body.data.job).toBeNull();
  expect(seen).toHaveLength(3); expect(waits).toEqual([125, 250]);
  expect(new Headers(seen[0]!.headers).get("Authorization")).toStartWith("Bearer ");
  expect(seen[0]!.credentials).toBe("omit"); expect(seen[0]!.cache).toBe("no-store"); expect(seen[0]!.redirect).toBe("error");
});
test("lost command response resends the exact captured key/body only on explicit retry", async () => {
  const captured: RequestInit[] = [];
  const client = new ApiClient({ baseUrl, credentials, fetch: async (_, init) => { captured.push(init); throw new Error("lost response"); } });
  const input = { path, headers: { "Idempotency-Key": createIdempotencyKey(bytes => bytes.fill(7)) }, body: {} };
  const command = client.prepare("createReportImageReview", input);
  await expect(command.send()).rejects.toBeInstanceOf(TransportError);
  expect(captured).toHaveLength(1);
  input.headers["Idempotency-Key"] = "different_key_0000001";
  await expect(command.send()).rejects.toBeInstanceOf(TransportError);
  expect(captured).toHaveLength(2);
  expect(new Headers(captured[1]!.headers).get("Idempotency-Key")).toBe(command.idempotencyKey);
  expect(captured[1]!.body).toBe(captured[0]!.body);
  expect(new Headers(captured[0]!.headers).has("If-Match")).toBe(false);
});
test("web mutations require CSRF and carry cookies; absent credentials cannot call protected routes", async () => {
  let calls = 0;
  const fetch = async (_: string, init: RequestInit) => {
    calls++; expect(init.credentials).toBe("include");
    expect(new Headers(init.headers).get("X-CSRF-Token")).toBe("c".repeat(32));
    return errorResponse(403, "FORBIDDEN");
  };
  const input = { path, headers: { "Idempotency-Key": "key_test_0000000001" }, body: {} };
  await expect(new ApiClient({ baseUrl, credentials: webCredentials(() => null), fetch }).request("createReportImageReview", input)).rejects.toBeInstanceOf(ContractValidationError);
  expect(calls).toBe(0);
  await expect(new ApiClient({ baseUrl, credentials: webCredentials(() => "c".repeat(32)), fetch }).request("createReportImageReview", input)).rejects.toBeInstanceOf(ApiError);
  expect(calls).toBe(1);
  await expect(new ApiClient({ baseUrl, credentials: () => ({ kind: "none" }), fetch }).request("getReportImageReview", { path })).rejects.toBeInstanceOf(ContractValidationError);
});
test("410/412 stop with typed recovery; malformed or cross-generation responses never become success", async () => {
  for (const [status, code, recovery] of [[410, "SESSION_RESET", "rejoin"], [412, "STALE_PROPOSAL", "replan"]] as const) {
    let calls = 0;
    const client = new ApiClient({ baseUrl, credentials, fetch: async () => { calls++; return errorResponse(status, code); } });
    const request = client.request("getReportImageReview", { path });
    if (status === 412) await expect(request).rejects.toBeInstanceOf(ContractValidationError);
    else await expect(request).rejects.toMatchObject({ recovery });
    expect(calls).toBe(1);
  }
  const stale = new ApiClient({ baseUrl, credentials, fetch: async () => errorResponse(412, "STALE_PROPOSAL") });
  await expect(stale.request("getEvents", { path: { session_id: sessionId }, query: { after: 0 } })).rejects.toMatchObject({ recovery: "replan" });
  for (const value of [response({ ...state, points: 1 }), response(state, { ...meta, generation: 1 }),
    response(state, meta, 200, { ETag: formatEtag({ session_id: sessionId, generation: 2, revision: 4 }) }),
    new Response("<html>error</html>", { headers: { "Content-Type": "text/html" } })]) {
    const client = new ApiClient({ baseUrl, credentials, fetch: async () => value });
    await expect(client.request("getReportImageReview", { path }, { scope: new RequestScope(sessionId, 2) })).rejects.toBeInstanceOf(ContractValidationError);
  }
});
test("obsolete session requests abort pending fetch and late response acceptance", async () => {
  let resolve!: (value: Response) => void;
  const pending = new Promise<Response>(r => { resolve = r; });
  const client = new ApiClient({ baseUrl, credentials, fetch: async () => pending });
  const scope = new RequestScope(sessionId, 2);
  const request = client.request("getReportImageReview", { path }, { scope });
  await Promise.resolve(); client.cancelSession(sessionId);
  await expect(request).rejects.toBeInstanceOf(RequestCancelledError);
  resolve(response(state));
});
test("Retry-After bounds and 429 server policy are respected", async () => {
  const waits: number[] = []; let calls = 0;
  const client = new ApiClient({ baseUrl, credentials, random: () => 0, wait: async ms => { waits.push(ms); },
    fetch: async () => ++calls === 1 ? errorResponse(429, "RATE_LIMITED", true, { "Retry-After": "2" }) : response(state) });
  await client.request("getReportImageReview", { path }); expect(waits).toEqual([2000]);
  const bounded = new ApiClient({ baseUrl, credentials, fetch: async () => errorResponse(429, "RATE_LIMITED", true, { "Retry-After": "90" }) });
  await expect(bounded.request("getReportImageReview", { path })).rejects.toBeInstanceOf(ApiError);
});

test("operational command 410/412 never auto-replays or rebases the captured ETag", async () => {
  for (const [status, code, recovery] of [[410, "SESSION_RESET", "rejoin"], [412, "STALE_PROPOSAL", "replan"]] as const) {
    let calls = 0;
    const etag = formatEtag({ session_id: sessionId, generation: 2, revision: 3 });
    const client = new ApiClient({ baseUrl, credentials, fetch: async (_, init) => {
      calls++; expect(new Headers(init.headers).get("If-Match")).toBe(etag);
      return errorResponse(status, code);
    } });
    await expect(client.request("reviewReport", { path, headers: { "If-Match": etag, "Idempotency-Key": "key_test_0000000001" },
      body: { decision: "reject", reason: "Insufficient evidence", mapped_segment_id: null, vehicle_types: [], condition: null } })).rejects.toMatchObject({ recovery });
    expect(calls).toBe(1);
  }
});
