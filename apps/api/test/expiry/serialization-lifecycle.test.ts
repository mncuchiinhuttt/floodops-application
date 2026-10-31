import { afterEach, describe, expect, it } from "vitest";
import { reset, runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { bindings, mutateSnapshot, rpc } from "../capabilities/helpers";
import { alterJob, queued, stored } from "../commands/image-fixtures";
import { createVersioned, removeMarker, snapshot } from "../commands/versioned-helpers";
afterEach(reset);
describe("legacy serialization keeps safe lifecycle without feature callbacks", () => {
  it("retains expired legacy jobs/leases without alarm spin or feature rewrites", async () => {
    const f = await createVersioned(); await queued(f); await removeMarker(f);
    await alterJob(f, record => { record.leaseExpires = Date.now() - 1000; record.job.deadline_at = new Date(Date.now() - 1000).toISOString(); });
    await mutateSnapshot(f, s => { s.leases.lease_legacy01 = { lease_id: "lease_legacy01", job_id: "planning_legacy01", kind: "planning", generation: 0, revision: 0,
      bind_revision: true, nonce_digest: "a".repeat(64), expires_at: Date.now() - 1000, status: "active", error_code: null }; });
    const before = await stored(f); const original = await snapshot(f); const stub = bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id));
    await runDurableObjectAlarm(stub);
    expect(await stored(f)).toEqual(before); const after = await snapshot(f); expect(after.leases).toEqual(original.leases); expect(after.values).toEqual(original.values);
    expect(after.meta.event_sequence).toBe(original.meta.event_sequence); expect((await rpc(f, {})).status).toBe(200);
    const next = await runInDurableObject(stub, (_instance, state) => state.storage.getAlarm()); expect(next! - Date.now()).toBeGreaterThan(1000);
  });
  it("still expires a legacy session and denies access without invoking feature reducers", async () => {
    const f = await createVersioned(); await queued(f); await removeMarker(f);
    await mutateSnapshot(f, s => { s.meta.expires_at = new Date(Date.now() - 1).toISOString(); });
    expect((await rpc(f, {})).status).toBe(410);
    const old = await snapshot(f); expect(old.meta.status).toBe("expired"); expect(old.meta.revision).toBe(0);
    expect((await stored(f)).jobs[0]!.job.status).toBe("superseded");
  });
});
