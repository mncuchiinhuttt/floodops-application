import { ApiClient } from "@floodops/api-client";
import { CredentialUnavailable, CredentialVault, type SecurePort } from "../src/shared/native/credential-vault";
import { NativeSessionService } from "../src/features/session/runtime/session-service";
import { delivery, now } from "./adapter-fixtures";

function storage(initial: string | null = null) {
  let raw = initial;
  const port = { available: jest.fn(async () => true), read: jest.fn(async () => raw),
    write: jest.fn(async (_key: string, value: string) => { raw = value; }),
    remove: jest.fn(async () => { raw = null; }) } satisfies SecurePort;
  return { port, vault: new CredentialVault(port, () => now) };
}
function instrument() {
  const api = new ApiClient({ baseUrl: "https://fixture.invalid/api/v1", credentials: async () => ({ kind: "none" }) });
  const request = jest.spyOn(api, "request");
  return { api, request };
}
const response = (data: unknown) => ({ body: { success: true, data, error: null, meta: {} }, status: 200,
  etag: null, version: null, requestId: null, retryAfterMs: null });

test("unavailable SecureStore denies both token access and adoption without reading or writing", async () => {
  const { port, vault } = storage(JSON.stringify(delivery())); port.available.mockResolvedValue(false);
  await expect(vault.readToken(delivery().session.session_id)).rejects.toBeInstanceOf(CredentialUnavailable);
  await expect(vault.adopt(delivery())).rejects.toBeInstanceOf(CredentialUnavailable);
  expect(port.read).not.toHaveBeenCalled(); expect(port.write).not.toHaveBeenCalled();
});

test.each(["read", "write"] as const)("SecureStore %s rejection cannot fall back to a prior bearer", async method => {
  const old = delivery(); const { port, vault } = storage(JSON.stringify(old));
  port[method].mockRejectedValueOnce(new Error("Synthetic storage failure"));
  const action = method === "read" ? vault.readToken(old.session.session_id) : vault.adopt(delivery(undefined, "replacement-native-bearer-00000000000000001"));
  await expect(action).rejects.toBeInstanceOf(CredentialUnavailable);
  await expect(vault.readToken(old.session.session_id)).rejects.toBeInstanceOf(CredentialUnavailable);
  expect(port.read).toHaveBeenCalledTimes(method === "read" ? 1 : 0);
});

test.each(["not-json", JSON.stringify({ session: {} }), JSON.stringify({ ...delivery(), credential: { ...delivery().credential, access_token: null } }),
  JSON.stringify({ ...delivery(), credential: { ...delivery().credential, client_type: "web" } }),
  JSON.stringify({ ...delivery(), credential: { ...delivery().credential, expires_at: "2026-10-30T00:00:00Z" } })])(
  "corrupt, wrong-client, missing or expired secure envelopes fail closed (case %#)", async raw => {
    const { vault } = storage(raw); await expect(vault.load()).rejects.toBeInstanceOf(CredentialUnavailable);
  });

test("null is unauthenticated; bearer is returned only for the stored session and latest principal", async () => {
  const { port, vault } = storage(); expect(await vault.load()).toBeNull();
  const first = delivery(); await vault.adopt(first);
  expect(await vault.readToken("ses_foreign01")).toBeNull();
  expect(await vault.readToken(first.session.session_id)).toBe(first.credential.access_token);
  const second = delivery(undefined, "synthetic-native-bearer-00000000000000000002");
  second.participant = { ...second.participant, participant_id: "par_second01" };
  await vault.adopt(second); const restarted = new CredentialVault(port, () => now);
  expect((await restarted.load())?.participant.participant_id).toBe("par_second01");
  expect(await restarted.readToken(second.session.session_id)).toBe(second.credential.access_token);
  await restarted.clear(); expect(await restarted.load()).toBeNull();
});

test("session adoption finishes secure persistence before its first identity request", async () => {
  const value = delivery(); const { vault, port } = storage(); const { api, request } = instrument();
  request.mockImplementation(async () => {
    expect(port.write).toHaveBeenCalledTimes(1);
    expect(await vault.readToken(value.session.session_id)).toBe(value.credential.access_token);
    return response({ participant: value.participant, session: value.session, csrf_token: null }) as never;
  });
  await expect(new NativeSessionService(api, vault, () => "synthetic-request-key-000000001").adopt(value))
    .resolves.toMatchObject({ participant: value.participant });
  expect(request.mock.calls[0]?.[2]?.scope?.signal.aborted).toBe(true);
});

test("failed secure adoption never requests identity with an old credential", async () => {
  const { vault, port } = storage(JSON.stringify(delivery())); const { api, request } = instrument();
  port.write.mockRejectedValueOnce(new Error("Synthetic write failure"));
  await expect(new NativeSessionService(api, vault, () => "synthetic-request-key-000000001").adopt(delivery())).rejects.toThrow(/secure credentials/);
  expect(request).not.toHaveBeenCalled();
});

test("identity cannot reuse a matching session credential for a different server principal", async () => {
  const value = delivery(); const { vault } = storage(JSON.stringify(value)); const { api, request } = instrument();
  request.mockResolvedValue(response({ participant: { ...value.participant, participant_id: "par_foreign01" }, session: value.session, csrf_token: null }) as never);
  await expect(new NativeSessionService(api, vault, () => "synthetic-request-key-000000001").restore()).rejects.toThrow(/correct native principal/);
  expect(request.mock.calls[0]?.[2]?.scope?.signal.aborted).toBe(true);
});

test("create and claim send native credential delivery and do not put bearer data in routing selectors", async () => {
  const value = delivery(); const { vault } = storage(); const { api, request } = instrument();
  request.mockImplementation(async operation => response(operation === "getIdentity"
    ? { participant: value.participant, session: value.session, csrf_token: null } : value) as never);
  let index = 0; const service = new NativeSessionService(api, vault, () => `synthetic-request-key-${String(++index).padStart(12, "0")}`);
  await service.create(value.session.scenario_id, value.session.scenario_version);
  expect(request.mock.calls[0]).toEqual(["createSession", { headers: {
    "Idempotency-Key": "synthetic-request-key-000000000001", "X-Client-Request-Scope": "synthetic-request-key-000000000002" },
    body: { scenario_id: value.session.scenario_id, scenario_version: value.session.scenario_version, client_type: "native" } }, expect.objectContaining({ signal: expect.anything() })]);
  const claim = "synthetic-invitation-claim-0000000000000001";
  await service.claim(value.session.session_id, claim);
  expect(request.mock.calls[2]).toEqual(["claimSession", { headers: { "Idempotency-Key": "synthetic-request-key-000000000003" },
    body: { session_id: value.session.session_id, claim_token: claim, client_type: "native" } }, expect.objectContaining({ signal: expect.anything() })]);
});

test("Leave during an outstanding secure adoption wins and cannot resurrect the old capability", async () => {
  const value = delivery(); let raw: string | null = null; let release!: () => void; let entered!: () => void;
  const writing = new Promise<void>(resolve => { entered = resolve; });
  const gate = new Promise<void>(resolve => { release = resolve; });
  const vault = new CredentialVault({ available: async () => true, read: async () => raw,
    write: async (_key, data) => { entered(); await gate; raw = data; }, remove: async () => { raw = null; } }, () => now);
  const { api, request } = instrument();
  const service = new NativeSessionService(api, vault, () => "synthetic-request-key-000000001");
  const adoption = service.adopt(value); await writing;
  service.cancelPending(); const leaving = vault.clear(); release();
  await expect(adoption).rejects.toThrow(/secure credentials|cancelled/); await leaving;
  expect(raw).toBeNull(); expect(await vault.load()).toBeNull(); expect(request).not.toHaveBeenCalled();
});
