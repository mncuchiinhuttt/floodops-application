import { afterEach, expect, it } from "vitest";
import { evictDurableObject, runDurableObjectAlarm, reset } from "cloudflare:test";
import { advanceRun } from "@floodops/simulation";
import { parseSchema } from "@floodops/contracts";
import { create, start, chunk, finish, snapshot, persistedRun, stub, etagOf, key, rpc, mutate } from "./runtime-fixtures";
import { ADVANCE_CHUNK } from "../../src/features/simulation/index";
import type { AdvanceReservation } from "../../src/features/simulation/index";

afterEach(reset);
it("persists reservation before work, checkpoints bounded real simulator progress and reloads after eviction", async () => {
  const f = await create(), initial = await persistedRun(f), reserved = await start(f);
  expect(reserved.status).toBe(200);
  const reservation = reserved.body.data as AdvanceReservation;
  let stored = await snapshot(f);
  expect(stored.meta).toMatchObject({ status: "advancing", sim_minute: 0, revision: 1 });
  expect(stored.leases[reservation.execution.leaseId]).toMatchObject({ status: "active", revision: 1 });
  expect((await persistedRun(f)).pendingTargetMs).toBe(1200000);
  const first = await chunk(f, reservation, etagOf(reserved), 0);
  expect(first.status).toBe(200);
  const job = parseSchema("AdvanceJob", first.body.data);
  expect(job.status).toBe("running"); expect(job.reached_sim_minute).toBeGreaterThan(0); expect(job.reached_sim_minute).toBeLessThan(20);
  const beforeReplay = await snapshot(f);
  const replay = await chunk(f, reservation, etagOf(reserved), 0);
  expect(JSON.stringify(replay.body) === JSON.stringify(first.body)).toBe(true); expect(await snapshot(f)).toEqual(beforeReplay);
  await evictDurableObject(stub(f));
  // finish uses a different per-chunk key sequence after the first committed boundary.
  let reply = first;
  for (let index = 1; index < 100; index++) {
    reply = await chunk(f, reservation, etagOf(reply), index);
    expect(reply.status).toBe(200);
    if (parseSchema("AdvanceJob", reply.body.data).status === "completed") break;
  }
  stored = await snapshot(f);
  expect(stored.meta).toMatchObject({ status: "active", sim_minute: 20 });
  expect(stored.pointers.active_advance_job_id).toBeNull();
  const actual = await persistedRun(f);
  const expected = advanceRun(initial, 20, { authorizeEntry: ({ knowledge }) => ({
    allowed: knowledge?.state === "known" && knowledge.confidence_band === "high", reason: "POL-02" }) }).run;
  expect(actual).toEqual(expected);
});

it("start idempotency returns the same private reservation and rejects target/key conflicts", async () => {
  const f = await create(), id = key(); const first = await start(f, 20, id);
  const state = await snapshot(f), again = await start(f, 20, id);
  expect(JSON.stringify(again.body) === JSON.stringify(first.body)).toBe(true); expect(await snapshot(f)).toEqual(state);
  expect((await start(f, 19, id)).status).toBe(409);
  expect((await start(f, 19, key(), etagOf(first))).body.error).toMatchObject({ code: "ADVANCE_IN_PROGRESS" });
});

it("rejects bad nonce even without a generic fence, superseded revision and stale CAS without simulator writes", async () => {
  const f = await create(), reserved = await start(f), value = reserved.body.data as AdvanceReservation;
  const before = await persistedRun(f);
  const rejected = await rpc(f, { kind: "command", name: ADVANCE_CHUNK, key: key(), ifMatch: etagOf(reserved),
    payload: { job_id: value.execution.jobId, lease_id: value.execution.leaseId, nonce: "a".repeat(64) } });
  expect(rejected.status).toBe(409); expect(await persistedRun(f)).toEqual(before);
  expect((await chunk(f, value, f.etag, 0)).status).toBe(412);
  await mutate(f, s => { s.meta.revision++; });
  expect((await chunk(f, value, etagOf(reserved), 1)).status).toBe(409);
  expect(await persistedRun(f)).toEqual(before);
});

it("access watchdog fails and unlocks without advancing or revising, then explicit same-target resume preserves final log", async () => {
  const f = await create(), initial = await persistedRun(f), reserved = await start(f), reservation = reserved.body.data as AdvanceReservation;
  const first = await chunk(f, reservation, etagOf(reserved), 0);
  const reached = await persistedRun(f), old = await snapshot(f);
  await mutate(f, s => { s.leases[reservation.execution.leaseId]!.expires_at = Date.now() - 1; });
  await evictDurableObject(stub(f));
  const identity = await rpc(f), expired = await snapshot(f);
  expect(expired.meta).toMatchObject({ status: "active", revision: old.meta.revision, sim_minute: old.meta.sim_minute });
  expect(await persistedRun(f)).toEqual(reached);
  const record = (expired.values.simulation_advances as { jobs: Record<string, { job: unknown }> }).jobs[reservation.execution.jobId]!;
  expect(record.job).toMatchObject({ status: "failed", error_code: "STORAGE_UNAVAILABLE" });
  expect((await chunk(f, reservation, etagOf(first), 1)).status).toBe(409);
  expect((await start(f, 19, key(), etagOf(identity))).status).toBe(409);
  const resumed = await start(f, 20, key(), etagOf(identity));
  expect(resumed.status).toBe(200); expect((await finish(f, resumed)).status).toBe(200);
  const expected = advanceRun(initial, 20, { authorizeEntry: ({ knowledge }) => ({
    allowed: knowledge?.state === "known" && knowledge.confidence_band === "high", reason: "POL-02" }) }).run;
  expect(await persistedRun(f)).toEqual(expected);
});

it("invalid targets and missing committed policy fail closed with no advance reservation", async () => {
  const f = await create();
  for (const target of [0, -1, 21]) expect((await start(f, target)).status).toBe(422);
  expect((await start(f, 20, key(), "")).status).toBe(428);
  await mutate(f, s => { s.values.test_missing_policy = true; });
  const result = await start(f);
  expect(result.status).toBe(503); expect(result.body.error).toMatchObject({ code: "CONFIG_INCOMPLETE" });
  const state = await snapshot(f);
  expect(state.meta).toMatchObject({ revision: 0, sim_minute: 0, status: "active" });
  expect(state.pointers.active_advance_job_id ?? null).toBeNull();
});


it("an old lease reconciliation cannot unlock a newer active advance", async () => {
  const f = await create(), first = await start(f), a = first.body.data as AdvanceReservation;
  await mutate(f, s => { s.leases[a.execution.leaseId]!.expires_at = Date.now() - 1; });
  const identity = await rpc(f), second = await start(f, 20, key(), etagOf(identity)), b = second.body.data as AdvanceReservation;
  expect(second.status).toBe(200);
  await mutate(f, s => { s.leases[a.execution.leaseId]!.status = "active"; s.leases[a.execution.leaseId]!.revision = s.meta.revision; });
  await rpc(f);
  const current = await snapshot(f);
  expect(current.meta.status).toBe("advancing");
  expect(current.pointers.active_advance_job_id).toBe(b.execution.jobId);
  expect((await chunk(f, a, etagOf(second), 0)).status).toBe(409);
  expect((await finish(f, second)).status).toBe(200);
});


it("the actual DO alarm expires a lease without running simulation time", async () => {
  const f = await create(), reserved = await start(f), value = reserved.body.data as AdvanceReservation;
  const before = await persistedRun(f), meta = (await snapshot(f)).meta;
  await mutate(f, s => { s.leases[value.execution.leaseId]!.expires_at = Date.now() - 1; });
  expect(await runDurableObjectAlarm(stub(f))).toBe(true);
  const after = await snapshot(f);
  expect(after.meta).toMatchObject({ revision: meta.revision, sim_minute: meta.sim_minute, status: "active" });
  expect(after.pointers.active_advance_job_id).toBeNull();
  expect(await persistedRun(f)).toEqual(before);
});
