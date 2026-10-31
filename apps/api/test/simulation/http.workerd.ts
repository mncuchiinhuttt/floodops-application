import { afterEach, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { create, auth, invite, request, key, start, rpc, fixture, etagOf, chunk, mutate } from "./runtime-fixtures";
import type { AdvanceReservation } from "../../src/features/simulation/index";

afterEach(reset);
it("actual HTTP router returns canonical202 without nonce and background driver reaches H/results", async () => {
  const f = await create(), id = key();
  const post = () => request(`/sessions/${f.id}/simulation/advances`, { method: "POST", headers: auth(f,
    { "Content-Type": "application/json", "Idempotency-Key": id, "If-Match": f.etag }), body: JSON.stringify({ target_sim_minute: 20 }) });
  const response = await post(); expect(response.status).toBe(202);
  const body = await response.text(); expect(body.includes("nonce")).toBe(false); expect(body.includes("execution")).toBe(false); expect(body.includes("nonce_digest")).toBe(false);
  const accepted = parseSchema("AdvanceJobResponse", JSON.parse(body)).data!;
  let clock = parseSchema("SimulationClockResponse", await (await request(`/sessions/${f.id}/simulation`, { headers: auth(f) })).json()).data!;
  for (let i = 0; i < 100 && clock.mode === "advancing"; i++) {
    clock = parseSchema("SimulationClockResponse", await (await request(`/sessions/${f.id}/simulation`, { headers: auth(f) })).json()).data!;
  }
  expect(clock.now_minute).toBe(20); expect(clock.mode).toBe("paused"); expect(clock.advance_job?.status).toBe("completed");
  const job = await request(`/sessions/${f.id}/simulation/advances/${accepted.advance_job_id}`, { headers: auth(f) });
  expect(job.status).toBe(200); expect(parseSchema("AdvanceJobResponse", await job.json()).data?.status).toBe("completed");
  const results = await request(`/sessions/${f.id}/results`, { headers: auth(f) });
  expect(results.status).toBe(200);
  expect(parseSchema("ResultsResponse", await results.json()).data).toMatchObject({ observed_until_minute: 20, calibration_status: "incomplete", late_reduction_ratio: 0 });
  const replay = await post(); expect(replay.status).toBe(202);
  expect(parseSchema("AdvanceJobResponse", await replay.json()).data).toEqual(accepted);
  expect((await request(`/sessions/${f.id}/simulation/advances/advance_missing1`, { headers: auth(f) })).status).toBe(404);
});

it("clock access follows canonical roles; advancing/job and results access stay dispatcher/viewer scoped", async () => {
  const owner = await create();
  for (const role of ["driver", "contributor", "viewer"] as const) {
    const member = await invite(owner, role);
    expect((await request(`/sessions/${owner.id}/simulation`, { headers: auth(member) })).status).toBe(200);
    const denied = await request(`/sessions/${owner.id}/simulation/advances`, { method: "POST", headers: auth(member,
      { "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": owner.etag }), body: JSON.stringify({ target_sim_minute: 20 }) });
    expect(denied.status).toBe(403);
    expect((await request(`/sessions/${owner.id}/simulation/advances/advance_missing1`, { headers: auth(member) })).status).toBe(403);
    expect((await request(`/sessions/${owner.id}/results`, { headers: auth(member) })).status).toBe(role === "viewer" ? 200 : 403);
  }
  expect((await request(`/sessions/${owner.id}/simulation`)).status).toBe(401);
  expect((await request(`/sessions/${owner.id}/simulation/advances`, { method: "POST", headers: auth(owner,
    { "Content-Type": "application/json", "If-Match": owner.etag }), body: JSON.stringify({ target_sim_minute: 20 }) })).status).toBe(422);
});

it("Reset denies old continuation and starts replacement generation from a fresh checkpoint", async () => {
  const owner = await create(), reserved = await start(owner), value = reserved.body.data as AdvanceReservation;
  const resetResponse = await request(`/sessions/${owner.id}/resets`, { method: "POST", headers: auth(owner,
    { "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": etagOf(reserved) }), body: JSON.stringify({ client_type: "native", confirm: true }) });
  expect(resetResponse.status).toBe(201);
  const replacement = fixture(parseSchema("ResetResultResponse", await resetResponse.json()).data!.replacement);
  expect(replacement.created.session.generation).toBe(1);
  expect((await chunk(owner, value, etagOf(reserved), 0)).status).toBe(410);
  const clock = await request(`/sessions/${replacement.id}/simulation`, { headers: auth(replacement) });
  expect(parseSchema("SimulationClockResponse", await clock.json()).data).toMatchObject({ now_minute: 0, advance_job: null, mode: "paused" });
  const stolen = await rpc(replacement, { kind: "command", name: "simulation.advance.chunk", key: key(), ifMatch: replacement.etag,
    payload: { job_id: value.execution.jobId, lease_id: value.execution.leaseId, nonce: value.execution.nonce } });
  expect(stolen.status).toBe(409);
});


it("results and clock fail closed on mismatched authoritative horizon", async () => {
  const f = await create();
  await mutate(f, s => { s.meta.horizon_minute = 21; });
  for (const suffix of ["results", "simulation"]) {
    const response = await request(`/sessions/${f.id}/${suffix}`, { headers: auth(f) });
    expect(response.status).toBe(503);
    expect(parseSchema("ErrorResponse", await response.json()).error?.code).toBe("CONFIG_INCOMPLETE");
  }
});
