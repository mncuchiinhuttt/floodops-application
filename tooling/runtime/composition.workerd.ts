import { afterEach, expect, it } from "vitest";
import { env, reset, runInDurableObject, SELF } from "cloudflare:test";
import { parseSchema, formatEtag } from "@floodops/contracts";
import type { PlatformBindings, Snapshot } from "../../apps/api/src/shared/index";
import { loadSessionScenario, scenarioReference, simulationPersistence } from "../../apps/api/src/index";
const bindings = env as unknown as PlatformBindings;
const key = () => crypto.randomUUID();
const path = (url: string, init?: RequestInit) => SELF.fetch("https://floodops.test/api/v1" + url, init);
afterEach(reset);
async function create() {
  const headers = { "Content-Type": "application/json", "Idempotency-Key": key(), "X-Client-Request-Scope": key(), "CF-Connecting-IP": "192.0.2.1" };
  const body = JSON.stringify({ scenario_id: scenarioReference.scenario_id, scenario_version: scenarioReference.scenario_version, client_type: "native" });
  const response = await path("/sessions", { method: "POST", headers, body });
  expect(response.status).toBe(201);
  const data = parseSchema("SessionCreatedResponse", await response.json()).data!;
  return { data, headers, body, id: data.session.session_id, token: data.credential.access_token! };
}
function auth(token: string) { return { Authorization: "Bearer " + token }; }
it("runs the actual entrypoint health, canonical error and origin boundary", async () => {
  const response = await path("/health");
  expect(response.status).toBe(200);
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(parseSchema("HealthResponse", await response.json()).data?.status).toBe("ok");
  expect((await path("/unknown")).status).toBe(404);
  expect((await path("/health", { headers: { Origin: "https://other.test" } })).status).toBe(403);
});
it("loads the real immutable synthetic bundle and persists only its reference plus mutable state", async () => {
  const owner = await create();
  const replay = await path("/sessions", { method: "POST", headers: owner.headers, body: owner.body });
  expect(replay.status).toBe(201);
  expect(parseSchema("SessionCreatedResponse", await replay.json()).data?.session.session_id).toBe(owner.id);
  await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)), (_instance, state) => {
    const row = state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one();
    const snapshot = JSON.parse(row.value) as Snapshot;
    const run = simulationPersistence.read(snapshot.values);
    expect(run.scenario.bundleHash).toBe("31d727d39d3add5f9cdc3078f704cdc69bfdaf700465a21cbee557aa8a0bc72c");
    expect(run.branches.floodops?.operations.drivers).toHaveLength(2);
    expect(run.branches.floodops?.operations.orders).toHaveLength(3);
    expect(snapshot.meta.calibration_status).toBe("incomplete");
    expect(snapshot.meta.horizon_minute).toBe(20);
    for (const values of [snapshot.values, snapshot.seed.values]) {
      const stored = values.simulation as { state: Record<string, unknown> };
      expect(stored.state).not.toHaveProperty("scenario");
      expect(stored.state).not.toHaveProperty("graph");
    }
    const kept = simulationPersistence.write({ otherOwner: { untouched: true } }, run);
    expect(kept.otherOwner).toEqual({ untouched: true });
  });
});
it("binds native driver/contributor invitation identity server-side and rejects unknown entities", async () => {
  const owner = await create();
  for (const [role, entity] of [["driver", "drv_moto01"], ["contributor", "contributor_functional1"]]) {
    const response = await path("/sessions/" + owner.id + "/invitations", { method: "POST", headers: { ...auth(owner.token), "Content-Type": "application/json", "Idempotency-Key": key() }, body: JSON.stringify({ role, bound_entity_id: entity, expires_in_seconds: 900 }) });
    expect(response.status).toBe(201);
    const invitation = parseSchema("InviteResponse", await response.json()).data!;
    const claimed = await path("/session-claims", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key() }, body: JSON.stringify({ session_id: owner.id, claim_token: invitation.claim_token, client_type: "native" }) });
    expect(claimed.status).toBe(201);
    const member = parseSchema("SessionCreatedResponse", await claimed.json()).data!;
    expect(member.participant.role).toBe(role);
    expect(member.participant.bound_entity_id).toBe(entity);
    const denied = await path("/sessions/" + owner.id + "/snapshot", { headers: auth(member.credential.access_token!) });
    expect(denied.status).toBe(403);
  }
  const invalid = await path("/sessions/" + owner.id + "/invitations", { method: "POST", headers: { ...auth(owner.token), "Content-Type": "application/json", "Idempotency-Key": key() }, body: JSON.stringify({ role: "driver", bound_entity_id: "drv_missing1", expires_in_seconds: 900 }) });
  expect(invalid.status).toBe(422);
});
it("resets into a fresh composed v2 session with generation fencing and current snapshot", async () => {
  const owner = await create();
  const resetResponse = await path("/sessions/" + owner.id + "/resets", { method: "POST", headers: { ...auth(owner.token), "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": formatEtag(owner.data.session) }, body: JSON.stringify({ client_type: "native", confirm: true }) });
  expect(resetResponse.status).toBe(201);
  const replaced = parseSchema("ResetResultResponse", await resetResponse.json()).data!.replacement;
  expect(replaced.session.generation).toBe(1);
  expect(replaced.session.revision).toBe(0);
  expect((await path("/sessions/" + owner.id, { headers: auth(owner.token) })).status).toBe(410);
  const token = replaced.credential.access_token;
  if (typeof token !== "string") throw new Error("Native Reset must return a bearer credential");
  const headers = auth(token);
  expect((await path("/sessions/" + replaced.session.session_id + "/identity", { headers })).status).toBe(200);
  const snapshot = await path("/sessions/" + replaced.session.session_id + "/snapshot", { headers });
  expect(snapshot.status).toBe(200);
  const data = parseSchema("SessionSnapshotResponse", await snapshot.json()).data!;
  expect(data.session.generation).toBe(1);
  expect(data.session.revision).toBe(0);
  expect(data.scenario.version).toBe("2");
  expect(data.knowledge.segments.length).toBeGreaterThan(0);
  expect(data.results.calibration_status).toBe("incomplete");
});
it("rejects unknown bundle/version and tampered checkpoint fingerprints", async () => {
  await expect(loadSessionScenario("scn_missing1", "1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(loadSessionScenario(scenarioReference.scenario_id, "1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  const seed = await loadSessionScenario(scenarioReference.scenario_id, scenarioReference.scenario_version);
  const bad = structuredClone(seed.values);
  (bad.simulation as { reference: { bundle_hash: string } }).reference.bundle_hash = "changed";
  expect(() => simulationPersistence.read(bad)).toThrow("CONFIG_INCOMPLETE");
});
