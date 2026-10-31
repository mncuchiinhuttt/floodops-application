import { DurableObject } from "cloudflare:workers";
import { parseSchema } from "@floodops/contracts";
import { hash, prepareProof, randomId, randomToken, seal, stable, validateKey } from "../shared/crypto";
import { errorReply, fail } from "../shared/platform-error";
import { isWebOrigin } from "../shared/web-origin";
import type { BackgroundDriverKind, Call, PlatformBindings, Reply, RuntimeRegistry, Snapshot } from "../shared/platform-types";
import { migrate } from "./schema";
import { Store } from "./store";
import { matchesSerialization } from "./serialization";
import { initialize, type Initialization } from "./initialize";
import { claim, membership, type InvitationMaterial, type StoredInvite } from "./membership";
import { issueCredentials } from "./credentials";
import { housekeeping, drainCleanup, compactClosedSession } from "./lifecycle";
import { parseQueuedImageFailure } from "./queued-image-failure";
import { imageCall, reconcileImages } from "./image-jobs";
import { resetSession } from "./reset";
import { reconcileLeases } from "./leases";
import { command } from "./transitions";
import { readCall } from "./reads";
export class SessionDO extends DurableObject<PlatformBindings> {
  protected registry: RuntimeRegistry = {};
  private store: Store;
  constructor(ctx: DurableObjectState, env: PlatformBindings) {
    super(ctx, env); migrate(ctx.storage); this.store = new Store(ctx.storage);
  }
  async install(serialized: string): Promise<string> {
    const input = JSON.parse(serialized) as Initialization;
    try {
      const reply = this.ctx.storage.transactionSync(() => initialize(this.store, input));
      await this.schedule(); return JSON.stringify(reply);
    } catch (error) { return JSON.stringify(errorReply(error, input.requestId)); }
  }
  async limitCreate(bucket: string, requestDigest: string, retryAfter: number, limit = 10): Promise<boolean> {
    const allowed = this.ctx.storage.transactionSync(() => {
      if (this.store.get<boolean>("create_requests", requestDigest)) return true;
      if (!this.store.consume("create", bucket, limit)) return false;
      this.store.put("create_requests", requestDigest, true); return true;
    });
    await this.ctx.storage.setAlarm(Date.now() + retryAfter * 1000);
    return allowed;
  }
  async dispatch(serialized: string): Promise<string> {
    const call = JSON.parse(serialized) as Call;
    return JSON.stringify(await this.invokeCall(call));
  }
  async startDriver(kind: BackgroundDriverKind, callJson: string, replyJson: string): Promise<void> {
    if (kind !== "planning" && kind !== "evaluation") fail(422, "INVALID_SCHEMA");
    const driver = this.registry.drivers?.[kind];
    if (!driver) fail(503, "CONFIG_INCOMPLETE");
    const call = JSON.parse(callJson) as Call, reply = JSON.parse(replyJson) as Reply;
    const dispatch = async (next: Call): Promise<Reply> => JSON.parse(await this.dispatch(JSON.stringify(next))) as Reply;
    this.ctx.waitUntil(kind === "evaluation" ? scheduler.wait(50).then(() => driver(dispatch, call, reply))
      : Promise.resolve().then(() => driver(dispatch, call, reply)));
  }
  protected async invokeCall(call: Call): Promise<Reply> {
    try {
      const proof = await prepareProof(call.auth);
      this.ctx.storage.transactionSync(() => { housekeeping(this.store, Date.now()); reconcileLeases(this.store, this.registry, Date.now()); reconcileImages(this.store, this.registry, Date.now()); });
      const snapshot = this.store.snapshot();
      if (snapshot.meta.session_id !== call.sessionId) fail(404, "NOT_FOUND");
      const mutation = ["command", "invite", "claim", "revoke", "logout", "delete", "reset", "image-reserve"].includes(call.kind);
      if (mutation) validateKey(call.key);
      const digest = await hash(stable({ session: call.sessionId, generation: snapshot.meta.generation,
        kind: call.kind, path: call.path, name: call.name, payload: call.payload ?? null }));
      if (call.kind === "reset") return await resetSession(this.store, this.env, call, proof, digest, this.registry);
      let invitation: InvitationMaterial | undefined;
      if (call.kind === "invite") {
        const input = parseSchema("InviteInput", call.payload);
        const token = randomToken(); const id = randomId("invite");
        const aad = stable([call.sessionId, id, call.key, digest]);
        invitation = { digest: await hash(token), invite: { invite_id: id, role: input.role, bound_entity_id: input.bound_entity_id,
          expires_at: new Date(Math.min(Date.now() + input.expires_in_seconds * 1000, Date.parse(snapshot.meta.expires_at), snapshot.absoluteExpiry)).toISOString(), claimed: false },
          delivery: { box: await seal(this.env, { token, csrf: null }, aad), aad, type: "invite" } };
      }
      if (call.kind === "claim") {
        const input = parseSchema("ClaimInput", call.payload);
        if (input.client_type === "web" && !isWebOrigin(this.env.WEB_ORIGIN, call.auth?.origin)) fail(403, "FORBIDDEN");
        const tokenDigest = await hash(input.claim_token);
        const invite = this.store.get<StoredInvite>("invitations", tokenDigest);
        if (!invite) fail(401, "UNAUTHENTICATED");
        const credentials = await issueCredentials(this.env, call.sessionId, call.key!, digest, invite.role, invite.bound_entity_id, false, input.client_type, snapshot.absoluteExpiry);
        return this.ctx.storage.transactionSync(() => {
          housekeeping(this.store, Date.now());
          return claim(this.store, call, tokenDigest, digest, credentials, Date.now());
        });
      }
      let lease = randomToken();
      if (call.kind === "image-fail-queued") lease = parseQueuedImageFailure(call.payload).lease;
      if (call.kind === "image-start" || call.kind === "image-complete") lease = (call.payload as { lease: string }).lease;
      const leaseDigest = await hash(lease);
      const fenceDigest = call.fence ? await hash(call.fence.nonce) : undefined;
      return this.ctx.storage.transactionSync(() => {
        const now = Date.now();
        // Crypto awaits above can interleave; always re-read/reconcile inside the final transaction.
        housekeeping(this.store, now); reconcileLeases(this.store, this.registry, now); reconcileImages(this.store, this.registry, now);
        if (call.kind === "command") {
          const result = command(this.store, this.registry, this.env, call, proof, digest, now, fenceDigest);
          return result;
        }
        if (["invite", "revoke", "logout", "delete"].includes(call.kind)) return membership(this.store, this.env, call, proof, digest, now, invitation);
        if (call.kind.startsWith("image-")) return imageCall(this.store, this.registry, this.env, call, proof, digest, now, lease, leaseDigest);
        return readCall(this.store, this.registry, this.env, call, proof, now);
      });
    } catch (error) { return errorReply(error, call.requestId); }
    finally { this.ctx.waitUntil(this.schedule()); }
  }
  override async alarm(): Promise<void> {
    this.ctx.storage.transactionSync(() => { housekeeping(this.store, Date.now()); reconcileLeases(this.store, this.registry, Date.now()); reconcileImages(this.store, this.registry, Date.now()); });
    await drainCleanup(this.store, this.env);
    this.ctx.storage.transactionSync(() => compactClosedSession(this.store, Date.now()));
    if (!this.store.get<Snapshot>("runtime", "snapshot")) { this.ctx.storage.sql.exec("DELETE FROM documents"); this.ctx.storage.sql.exec("DELETE FROM counters"); return; }
    await this.schedule();
  }
  private async schedule(): Promise<void> {
    const snapshot = this.store.get<Snapshot>("runtime", "snapshot");
    if (!snapshot) return;
    const active = snapshot.meta.status !== "expired" && snapshot.meta.status !== "reset";
    const now = Date.now();
    const compatible = matchesSerialization(snapshot.seed, this.registry);
    const pendingImages = compatible ? this.store.list<import("../shared/platform-types").ImageRecord>("image_jobs").filter(r => ["queued", "running"].includes(r.job.status)) : [];
    const deadlines = pendingImages.map(r => r.leaseExpires);
    if (compatible) deadlines.push(...Object.values(snapshot.leases ?? {}).filter(l => l.status === "active").map(l => l.expires_at));
    if (active) await this.ctx.storage.setAlarm(Math.max(now + 1, Math.min(now + 15000, Date.parse(snapshot.meta.expires_at), ...deadlines)));
    else if (this.store.list<{ expires: number }>("streams").some(stream => stream.expires > now)) {
      const streamDeadlines = this.store.list<{ expires: number }>("streams").map(stream => stream.expires).filter(expires => expires > now);
      await this.ctx.storage.setAlarm(Math.max(now + 1, Math.min(now + 15000, ...streamDeadlines)));
    } else if (this.store.list("cleanup").length) await this.ctx.storage.setAlarm(now + 15000);
    else if (snapshot.meta.status === "reset" && this.ctx.storage.sql.exec("SELECT sequence FROM events LIMIT 1").toArray().length) await this.ctx.storage.setAlarm(now + 15000);
    else if (snapshot.absoluteExpiry > now) await this.ctx.storage.setAlarm(snapshot.absoluteExpiry);
  }
}
export function createSessionObject(registry: RuntimeRegistry): typeof SessionDO {
  return class RegisteredSessionDO extends SessionDO { protected override registry = registry; };
}
