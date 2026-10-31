import { afterEach, describe, expect, it } from "vitest";
import { reset, runInDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { bindings, command, create, invite, mutateSnapshot, requestKey, rpc } from "../capabilities/helpers";
import { alterJob, context, metadata, queued, reportId, stored } from "./image-fixtures";
afterEach(reset);
describe("strict queued failure fences", () => {
  it("rejects success, result, unknown/missing fields and invalid failure enums", async () => {
    const f = await create(); const { job, lease } = await queued(f);
    const valid = { job_id: job.job_id, lease, error_code: "MODEL_UNAVAILABLE" };
    for (const payload of [{ ...valid, success: true }, { ...valid, result: null }, { ...valid, status: "failed" },
      { ...valid, extra: 1 }, { job_id: job.job_id, lease }, { ...valid, error_code: null }, { ...valid, error_code: "UNAUTHENTICATED" },
      { ...valid, job_id: "invalid" }, { ...valid, lease: "invalid" }, null, []]) {
      expect((await rpc(f, { kind: "image-fail-queued", name: reportId, payload })).status).toBe(422);
    }
    const state = await stored(f); expect(state.calls).toBe(0); expect(state.jobs[0]!.job.status).toBe("queued");
    expect((await rpc(f, {})).body.meta.event_sequence).toBe(1);
  });
  it("rejects wrong actors including a non-dispatcher with a forged permission row", async () => {
    const f = await create(); const { job, lease } = await queued(f);
    for (const role of ["driver", "contributor", "viewer"] as const) {
      const actor = await invite(f, role); expect((await metadata.failQueued(context(actor), reportId, job.job_id, lease, "MODEL_UNAVAILABLE")).status).toBe(403);
      if (role === "driver") {
        await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
          const rows = state.storage.sql.exec<{ id: string; value: string }>("SELECT id,value FROM documents WHERE collection='participants'").toArray();
          const row = rows.find(r => JSON.parse(r.value).participant.participant_id === actor.participant)!;
          const record = JSON.parse(row.value); record.participant.permissions.push("reports:review");
          state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='participants' AND id=?", JSON.stringify(record), row.id);
        });
        expect((await metadata.failQueued(context(actor), reportId, job.job_id, lease, "MODEL_UNAVAILABLE")).status).toBe(403);
      }
    }
    expect((await stored(f)).jobs[0]!.job.status).toBe("queued");
  });
  it("requires matching web Origin and CSRF", async () => {
    const f = await create("web"); const { job, lease } = await queued(f); const base = context(f);
    for (const auth of [{ ...base.auth, csrf: null }, { ...base.auth, origin: "https://unapproved.invalid" }, { ...base.auth, transport: "bearer" as const }]) {
      const result = await metadata.failQueued({ ...base, auth }, reportId, job.job_id, lease, "STORAGE_UNAVAILABLE"); expect([401, 403]).toContain(result.status);
    }
    expect((await metadata.failQueued(base, reportId, job.job_id, lease, "STORAGE_UNAVAILABLE")).status).toBe(200);
  });
  it("rejects wrong session, report, job and nonce without touching the queued job", async () => {
    const f = await create(); const other = await create(); const { job, lease } = await queued(f);
    expect((await metadata.failQueued(context(other), reportId, job.job_id, lease, "MODEL_UNAVAILABLE")).status).toBe(404);
    expect((await metadata.failQueued(context(f), "report_unknown1", job.job_id, lease, "MODEL_UNAVAILABLE")).status).toBe(404);
    expect((await metadata.failQueued(context(f), reportId, "imagejob_unknown1", lease, "MODEL_UNAVAILABLE")).status).toBe(404);
    expect((await metadata.failQueued(context(f), reportId, job.job_id, lease[0] === "A" ? "B".repeat(43) : "A".repeat(43), "MODEL_UNAVAILABLE")).status).toBe(409);
    expect((await stored(f)).jobs[0]!.job.status).toBe("queued");
  });
  it.each(["started", "generation", "input", "model", "config", "pointer", "deadline", "lease"])("rejects stale %s", async fence => {
    const f = await create(); const { job, lease } = await queued(f);
    if (fence === "pointer") {
      await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
        state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='image_current'", JSON.stringify("imagejob_otherjob"));
      });
    } else await alterJob(f, record => {
      if (fence === "started") record.started = true;
      if (fence === "generation") record.job.generation++;
      if (fence === "input") record.job.input_digest = "f".repeat(64);
      if (fence === "model") record.job.model = "other-model";
      if (fence === "config") record.job.model_config_hash = "f".repeat(64);
      if (fence === "deadline") record.job.deadline_at = new Date(Date.now() - 1).toISOString();
      if (fence === "lease") record.leaseExpires = Date.now() - 1;
    });
    expect((await metadata.failQueued(context(f), reportId, job.job_id, lease, "MODEL_UNAVAILABLE")).status).toBe(409);
    const saved = await stored(f); expect(saved.calls).toBe(0); expect(saved.jobs[0]!.job.error_code).not.toBe("MODEL_UNAVAILABLE");
  });
  it("rejects corrupted persisted rubric data with no publication or charge", async () => {
    const f = await create(); const { job, lease } = await queued(f);
    await alterJob(f, record => { (record.job as unknown as Record<string, unknown>).rubric_version = "invalid-rubric"; });
    const reply = await metadata.failQueued(context(f), reportId, job.job_id, lease, "MODEL_UNAVAILABLE");
    expect(reply.status).toBe(422); expect((await stored(f)).calls).toBe(0);
  });
  it("rejects running/completed jobs and late callbacks after operational review", async () => {
    const f = await create(); const { job, lease } = await queued(f); await metadata.start(context(f), reportId, job.job_id, lease);
    expect((await metadata.failQueued(context(f), reportId, job.job_id, lease, "MODEL_UNAVAILABLE")).status).toBe(409);
    const advice = { quality_ratings: { sharpness: 1, lighting: 2, scene_visibility: 1, detail: 2 }, quality_score: 75,
      visible_summary: "Synthetic", report_match: "yes" as const, mismatch_notes: [], reasons: ["Synthetic"], recommendation: "looks_consistent" as const };
    expect((await metadata.complete(context(f), reportId, job.job_id, lease, { result: advice })).status).toBe(200);
    expect((await metadata.failQueued(context(f), reportId, job.job_id, lease, "MODEL_UNAVAILABLE")).status).toBe(409);
    const g = await create(); const pending = await queued(g); expect((await command(g, 0, requestKey(), g.etag, "review")).status).toBe(200);
    expect((await metadata.failQueued(context(g), reportId, pending.job.job_id, pending.lease, "MODEL_UNAVAILABLE")).status).toBe(409);
    expect(parseSchema("ImageReviewState", (await metadata.read(context(g), reportId)).body.data).job?.status).toBe("superseded");
  });
  it("rejects Reset, expiry, revoked and permissionless dispatchers", async () => {
    const f = await create(); const first = await queued(f);
    expect((await rpc(f, { kind: "reset", key: requestKey(), ifMatch: f.etag, payload: { confirm: true, client_type: "native" } })).status).toBe(201);
    expect((await metadata.failQueued(context(f), reportId, first.job.job_id, first.lease, "MODEL_UNAVAILABLE")).status).toBe(410);
    const expired = await create(); const second = await queued(expired); await mutateSnapshot(expired, s => { s.meta.expires_at = new Date(Date.now() - 1).toISOString(); });
    expect((await metadata.failQueued(context(expired), reportId, second.job.job_id, second.lease, "MODEL_UNAVAILABLE")).status).toBe(410);
    for (const mode of ["revoked", "permission"] as const) {
      const g = await create(); const item = await queued(g);
      await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(g.id)), (_instance, state) => {
        const row = state.storage.sql.exec<{ id: string; value: string }>("SELECT id,value FROM documents WHERE collection='participants'").one();
        const record = JSON.parse(row.value); if (mode === "revoked") record.revoked = true; else record.participant.permissions = [];
        state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='participants' AND id=?", JSON.stringify(record), row.id);
      });
      expect((await metadata.failQueued(context(g), reportId, item.job.job_id, item.lease, "MODEL_UNAVAILABLE")).status).toBe(mode === "revoked" ? 401 : 403);
    }
  });
});
