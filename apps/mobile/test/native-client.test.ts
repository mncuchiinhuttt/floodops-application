import { ApiClient } from "@floodops/api-client";
import { NativeSessionClient, createNativeApi } from "../src/shared/native-client";
import { fixtureContext } from "../preview/fixture-data";
function instrument() {
  const api = new ApiClient({ baseUrl: "https://fixture.invalid/api/v1", credentials: async () => ({ kind: "none" }) });
  const request = jest.spyOn(api, "request").mockResolvedValue({ body: {}, status: 200, etag: null, version: null, requestId: null, retryAfterMs: null } as never);
  return { api, request };
}
test("own dashboard adapter never adds role/entity selectors and binds request cancellation", async () => {
  const { api, request } = instrument(); const client = new NativeSessionClient(api, fixtureContext("driver"));
  await client.driverDashboard();
  expect(request).toHaveBeenCalledWith("getOwnDriverDashboard", { path: { session_id: "ses_fixture01" } }, { scope: client.scope });
  await expect(client.snapshot()).rejects.toThrow(/capability|permission/);
  client.invalidate(); expect(client.scope.signal.aborted).toBe(true);
  await expect(client.driverDashboard()).rejects.toThrow(/Rejoin/); expect(request).toHaveBeenCalledTimes(1);
});
test("AI body/key is separate from manual revision command and no mutation is queued offline", async () => {
  const { api, request } = instrument(); const context = { ...fixtureContext(), online: true };
  const client = new NativeSessionClient(api, context);
  await client.requestImageReview("rep_fixture01", "image-review-key-0001");
  expect(request).toHaveBeenLastCalledWith("createReportImageReview", { path: { session_id: "ses_fixture01", report_id: "rep_fixture01" },
    headers: { "Idempotency-Key": "image-review-key-0001" }, body: {} }, { scope: client.scope });
  await client.reviewReport("rep_fixture01", { decision: "reject", reason: "Manual check", mapped_segment_id: null, vehicle_types: [], condition: null }, "manual-review-key-0001");
  expect(request).toHaveBeenLastCalledWith("reviewReport", expect.objectContaining({ headers: { "If-Match": '"s:ses_fixture01:g:1:r:3"', "Idempotency-Key": "manual-review-key-0001" } }), { scope: client.scope });
  await expect(client.executePlan("pln_fixture01", { group_ids: ["grp_fixture01"] }, "execute-key-000001")).rejects.toThrow(/Refresh authoritative/);
  const offline = new NativeSessionClient(api, { ...context, online: false });
  await expect(offline.requestImageReview("rep_fixture01", "offline-image-key-001")).rejects.toThrow(/Connection required/);
  expect(request).toHaveBeenCalledTimes(2);
});
test("each explicit operation checks its fixed server permission", async () => {
  const { api, request } = instrument(); const context = { ...fixtureContext(), online: true };
  context.participant = { ...context.participant, permissions: ["reports:review"] };
  const client = new NativeSessionClient(api, context);
  await expect(client.executePlan("pln_fixture01", { group_ids: ["grp_fixture01"] }, "execute-key-000001")).rejects.toThrow(/planning:execute/);
  await expect(client.decidePlan("pln_fixture01", { action_ids: ["act_fixture01"], decision: "approve", reason: "Review" }, "decision-key-00001")).rejects.toThrow(/planning:decide/);
  expect(request).not.toHaveBeenCalled();
});
test("credential adapter requires a supplied native port and performs no persistence", () => {
  const readToken = jest.fn(async () => null);
  const client = createNativeApi("https://fixture.invalid/api/v1", { readToken });
  expect(client).toBeInstanceOf(ApiClient); expect(readToken).not.toHaveBeenCalled();
});
