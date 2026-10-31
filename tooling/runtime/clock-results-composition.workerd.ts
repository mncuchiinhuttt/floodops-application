import { afterEach, expect, it } from "vitest";
import { reset, SELF } from "cloudflare:test";
import { formatEtag, parseSchema } from "@floodops/contracts";
import { scenarioReference } from "../../apps/api/src/index";
afterEach(reset);
const key = () => crypto.randomUUID();
const request = (path: string, init?: RequestInit) => SELF.fetch("https://floodops.test/api/v1" + path, init);
async function create() {
  const response = await request("/sessions", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key(), "X-Client-Request-Scope": key(), "CF-Connecting-IP": "192.0.2.30" }, body: JSON.stringify({ scenario_id: scenarioReference.scenario_id, scenario_version: scenarioReference.scenario_version, client_type: "native" }) });
  expect(response.status).toBe(201);
  const owner = parseSchema("SessionCreatedResponse", await response.json()).data;
  return { owner, path: "/sessions/" + owner.session.session_id, auth: { Authorization: "Bearer " + owner.credential.access_token } };
}
it("serves canonical clock and real observed branch results from the persisted production seed", async () => {
  const { owner, path, auth } = await create();
  const response = await request(path + "/simulation", { headers: auth });
  expect(response.status).toBe(200);
  const clock = parseSchema("SimulationClockResponse", await response.json()).data;
  expect(clock.now_minute).toBe(0);
  expect(clock.horizon_minute).toBe(20);
  expect(clock.advance_job).toBeNull();
  const result = await request(path + "/results", { headers: auth });
  expect(result.status).toBe(200);
  const data = parseSchema("ResultsResponse", await result.json()).data;
  expect(data.session_id).toBe(owner.session.session_id);
  expect(data.observed_until_minute).toBe(0);
  expect(data.horizon_minute).toBe(20);
  expect(data.calibration_status).toBe("incomplete");
  expect(data.branches).toHaveLength(3);
  expect(data.label).toBe("Simulation result");
  expect((await request(path + "/results")).status).toBe(401);
  expect((await request(path + "/simulation/advances/advance_absent1", { headers: auth })).status).toBe(404);
});
it("does not start or silently authorize movement when the genuine committed-policy port is absent", async () => {
  const { owner, path, auth } = await create();
  const response = await request(path + "/simulation/advances", { method: "POST", headers: { ...auth, "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": formatEtag(owner.session) }, body: JSON.stringify({ target_sim_minute: 1 }) });
  expect(response.status).toBe(503);
  expect(parseSchema("ErrorResponse", await response.json()).error.code).toBe("CONFIG_INCOMPLETE");
  const clock = parseSchema("SimulationClockResponse", await (await request(path + "/simulation", { headers: auth })).json()).data;
  expect(clock.now_minute).toBe(0);
  expect(clock.advance_job).toBeNull();
  const meta = parseSchema("SessionMetaResponse", await (await request(path, { headers: auth })).json()).data;
  expect(meta.revision).toBe(owner.session.revision);
});
