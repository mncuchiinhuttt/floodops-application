import { afterEach, describe, expect, it } from "vitest";
import { reset, evictDurableObject } from "cloudflare:test";
import { hash } from "../../src/shared/crypto";
import type { DurableLease } from "../../src/shared/platform-types";
import { bindings, create, mutateSnapshot, requestKey, rpc } from "../capabilities/helpers";
afterEach(reset);
describe("generic durable leases and current pointers", () => {
  it("supersedes old advance A without clearing newer active B", async () => {
    const f = await create(); const nonce = requestKey(); const digest = await hash(nonce); const now = Date.now();
    const lease: DurableLease = { lease_id: "lease_advance_a1", job_id: "advance_job_a1", kind: "advance", generation: 0, revision: 0,
      bind_revision: true, nonce_digest: digest, expires_at: now - 1, status: "active", error_code: null };
    await mutateSnapshot(f, s => {
      s.meta.status = "advancing"; s.pointers.active_advance_job_id = "advance_job_b1";
      s.leases[lease.lease_id] = lease; s.leases.lease_advance_b1 = { ...lease, lease_id: "lease_advance_b1", job_id: "advance_job_b1", expires_at: now + 20000 };
    });
    expect((await rpc(f, { kind: "command", name: "counter", key: requestKey(), ifMatch: f.etag, payload: { amount: 1 }, fence: { lease_id: lease.lease_id, nonce } })).status).toBe(409);
    const identity = await rpc(f, {}); expect((identity.body.data as { session: { status: string } }).session.status).toBe("advancing");
    expect(identity.body.meta.revision).toBe(0);
    expect((await rpc(f, { kind: "command", name: "counter", key: requestKey(), ifMatch: f.etag, payload: { amount: 1 }, fence: { lease_id: "lease_advance_b1", nonce } })).status).toBe(200);
  });
  it("watchdog marks the current advance failed after eviction without changing clock/revision", async () => {
    const f = await create();
    await mutateSnapshot(f, s => { s.meta.status = "advancing"; s.pointers.active_advance_job_id = "advance_job_c1";
      s.leases.lease_advance_c1 = { lease_id: "lease_advance_c1", job_id: "advance_job_c1", kind: "advance", generation: 0, revision: 0,
        bind_revision: true, nonce_digest: "a".repeat(64), expires_at: Date.now() - 1, status: "active", error_code: null }; });
    await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)));
    const r = await rpc(f, {}); const session = (r.body.data as { session: { status: string; sim_minute: number } }).session;
    expect(session.status).toBe("active"); expect(session.sim_minute).toBe(0); expect(r.body.meta.revision).toBe(0);
    expect(r.body.meta.event_sequence).toBe(1);
  });
  it("rejects same-revision superseded proposal pointers before operational writes", async () => {
    const f = await create();
    await mutateSnapshot(f, s => { s.pointers.latest_requested_job_id = "planning_job_new1"; s.pointers.latest_plan_id = null; });
    const r = await rpc(f, { kind: "command", name: "counter", key: requestKey(), ifMatch: f.etag, payload: { amount: 8 }, expectedPointers: { latest_plan_id: "plan_old0001" } });
    expect(r.status).toBe(409); expect((await rpc(f, {})).body.meta.revision).toBe(0);
  });
});
