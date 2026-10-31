import { expect, test, vi } from "vitest";
import { ApiClient, ApiError, RequestScope, webCredentials, type FetchAdapter } from "@floodops/api-client";
import { createBoundClient, type ClientContext } from "../src/shared/client-context";
import { createReportClient } from "../src/features/reports/client";
import { createPlanningClient } from "../src/features/planning/client";
import { commandError } from "../src/shared/use-command";
import { driverDashboard, driverRoute, identity, imageReview, now, session } from "../preview/fixtures";
const key = "fixture-idempotency-key";
function harness(role: "driver" | "dispatcher" = "dispatcher") {
  let context: ClientContext = { identity: identity(role), online: true, now, scope: new RequestScope(session.session_id, 1) };
  const fetch = vi.fn<FetchAdapter>(async () => Response.json({ success: true, data: driverDashboard, error: null,
    meta: { request_id: "fixture", session_id: session.session_id, generation: 1, revision: 4, event_sequence: 8 } }));
  const api = new ApiClient({ baseUrl: "/api/v1", fetch, credentials: webCredentials(() => "x".repeat(32)), getRetry: { maxRetries: 0 } });
  const bound = createBoundClient(api, () => context);
  return { fetch, reports: createReportClient(bound), plans: createPlanningClient(bound), get: () => context, set: (value: ClientContext) => { context = value; } };
}
test("driver adapter requests only own endpoint and preserves authoritative response", async () => {
  const h = harness("driver"); const response = await h.reports.driverDashboard();
  expect(response.body.data).toEqual(driverDashboard);
  expect(h.fetch.mock.calls[0]?.[0]).toBe(`/api/v1/sessions/${session.session_id}/drivers/me`);
  expect(() => h.reports.contributorDashboard()).toThrow(/Capability/);
  expect(h.fetch).toHaveBeenCalledTimes(1);
});
test("revision command captures CAS/key; 412 is not replayed and reports Needs replan", async () => {
  const h = harness(); h.fetch.mockImplementation(async () => Response.json({ success: false, data: null, error: {
    code: "REVISION_MISMATCH", message: "stale", details: [], retryable: false, current_revision: 5, replacement_session_id: null,
  }, meta: { request_id: "fixture" } }, { status: 412 }));
  const command = h.plans.decide("plan_fixture001", { action_ids: ["action_fixture001"], decision: "approve", reason: "Reviewed" }, key);
  let failure: unknown;
  try { await command.send(); } catch (error) { failure = error; }
  expect(failure).toBeInstanceOf(ApiError); expect(commandError(failure)).toContain("Needs replan");
  expect(h.fetch).toHaveBeenCalledTimes(1);
  const options = h.fetch.mock.calls[0]?.[1]; const headers = new Headers(options?.headers);
  expect(headers.get("If-Match")).toBe('"s:session_fixture001:g:1:r:4"'); expect(headers.get("Idempotency-Key")).toBe(key);
  expect(h.fetch.mock.calls[0]?.[0]).toContain("/decisions");
  await expect(command.send()).rejects.toThrow("Needs replan");
  expect(h.fetch).toHaveBeenCalledTimes(1);
});
test("offline, Reset, participant switch and in-place revision mutation invalidate prepared command", async () => {
  for (const change of ["offline", "reset", "participant", "mutate"]) {
    const h = harness(); const command = h.plans.execute("plan_fixture001", { group_ids: ["group_fixture001"] }, key);
    const context = h.get();
    if (change === "offline") h.set({ ...context, online: false });
    if (change === "reset") context.scope.cancel();
    if (change === "participant") context.identity.participant.participant_id = "another-dispatcher";
    if (change === "mutate") context.identity.session.revision = 5;
    await expect(command.send()).rejects.toThrow(); expect(h.fetch).not.toHaveBeenCalled();
  }
});
test("AI POST has empty body/idempotency and no operational CAS; invalid key fails before transport", async () => {
  const h = harness(); h.fetch.mockImplementation(async () => Response.json({ success: true, data: imageReview.job, error: null,
    meta: { request_id: "fixture", session_id: session.session_id, generation: 1, revision: 4, event_sequence: 9 } }, { status: 202 }));
  expect(() => h.reports.requestImageReview("report_fixture001", "short")).toThrow();
  await h.reports.requestImageReview("report_fixture001", key).send();
  const options = h.fetch.mock.calls[0]?.[1]; const headers = new Headers(options?.headers);
  expect(options?.body).toBe("{}"); expect(headers.get("If-Match")).toBeNull(); expect(headers.get("Idempotency-Key")).toBe(key);
});

test("route adapter follows own-dashboard pointers and rejects changed route ownership/version", async () => {
  for (const invalid of [false, true]) {
    const h = harness("driver");
    h.fetch.mockImplementation(async input => Response.json({ success: true, error: null,
      data: input.endsWith("/drivers/me") ? driverDashboard : { ...driverRoute, ...(invalid ? { driver_id: "driver_other001" } : {}) },
      meta: { request_id: "fixture", session_id: session.session_id, generation: 1, revision: 4, event_sequence: 8 } }));
    if (invalid) await expect(h.reports.driverRoutes()).rejects.toThrow(/khớp dashboard/);
    else expect((await h.reports.driverRoutes()).routes).toEqual([driverRoute]);
    expect(h.fetch.mock.calls.map(call => call[0])).toEqual([
      `/api/v1/sessions/${session.session_id}/drivers/me`, `/api/v1/sessions/${session.session_id}/routes/route_fixture001`,
    ]);
  }
});
