import { parseSchema } from "@floodops/contracts";
import { hash, randomId, stable } from "../shared/crypto";
import { fail, success } from "../shared/platform-error";
import type { Call, PlatformBindings, Proof, Reply, RuntimeRegistry, Snapshot, StoredParticipant } from "../shared/platform-types";
import { authenticate, credentialCheck, MAX_AGE_MS, requireCas } from "./auth";
import { created, issueCredentials } from "./credentials";
import { appendEvents } from "./events";
import { supersedeImages } from "./lifecycle";
import type { Initialization } from "./initialize";
import { Store } from "./store";
import { seedForReset } from "./serialization";
export interface ResetRecord {
  key: string; digest: string; stage: "allocated" | "initialized" | "tombstoned";
  original: StoredParticipant; replacement: StoredParticipant; replayUntil: number;
  initialization: Initialization; reply: Reply;
}
export async function resetSession(store: Store, env: PlatformBindings, call: Call, proof: Proof | undefined, digest: string, registry: RuntimeRegistry = {}): Promise<Reply> {
  const input = parseSchema("ResetInput", call.payload);
  const now = Date.now();
  // Material is prepared before the transaction; the first committed intent owns the target.
  const snapshot = store.snapshot();
  const targetId = randomId("session");
  const credentials = await issueCredentials(env, targetId, call.key!, digest, "dispatcher", null, true, input.client_type, now + MAX_AGE_MS);
  const marker = await hash(stable([snapshot.meta.session_id, targetId, call.key!, digest]));
  const record = store.storage.transactionSync(() => {
    const now = Date.now();
    const current = store.snapshot();
    const existing = store.get<ResetRecord>("reset", "intent");
    if (existing) {
      if (existing.key !== call.key) {
        authenticate(store, current, proof, env, now, true, "simulation:reset");
        fail(409, "STATE_CONFLICT", current);
      }
      recover(existing, proof, env, now, digest);
      return existing;
    }
    const actor = authenticate(store, current, proof, env, now, true, "simulation:reset");
    store.replay(actor.participant.participant_id, call.key!, digest);
    requireCas(current, call.ifMatch);
    const seed = seedForReset(current, registry);
    credentials.record.participant.is_owner = actor.participant.is_owner;
    credentials.record.participant.permissions = [...actor.participant.permissions];
    const initialization: Initialization = { sessionId: targetId, generation: current.meta.generation + 1, seed,
      credentials, key: call.key!, digest, marker, requestId: call.requestId, now };
    const replacementSnapshot: Snapshot = { ...current, meta: { ...current.meta, session_id: targetId, generation: current.meta.generation + 1,
      revision: 0, event_sequence: 0, sim_minute: 0, status: "active", created_at: new Date(now).toISOString(), expires_at: new Date(now + 3600000).toISOString() } };
    const reply: Reply = { ...success(201, { old_session_id: current.meta.session_id, replacement: created(replacementSnapshot, credentials) }, call.requestId, replacementSnapshot), credential: credentials.delivery };
    const intent: ResetRecord = { key: call.key!, digest, stage: "allocated", original: actor, replacement: credentials.record,
      replayUntil: Date.parse(actor.participant.expires_at), initialization, reply };
    current.meta.status = "resetting";
    current.values.replacement_session_id = targetId;
    supersedeImages(store, current, now);
    store.save(current);
    store.put("reset", "intent", intent);
    return intent;
  });
  if (record.stage === "tombstoned") return record.reply;
  const target = env.SESSIONS.get(env.SESSIONS.idFromName(record.initialization.sessionId));
  const initialized = JSON.parse(await target.install(JSON.stringify(record.initialization))) as Reply;
  if (initialized.status !== 201) fail(503, "STORAGE_UNAVAILABLE");
  store.storage.transactionSync(() => {
    const intent = store.get<ResetRecord>("reset", "intent")!;
    if (intent.stage === "allocated") { intent.stage = "initialized"; store.put("reset", "intent", intent); }
  });
  return store.storage.transactionSync(() => {
    const intent = store.get<ResetRecord>("reset", "intent")!;
    if (intent.stage === "tombstoned") return intent.reply;
    const old = store.snapshot();
    old.meta.status = "reset";
    old.values.replacement_session_id = intent.initialization.sessionId;
    for (const key of store.list<string>("media_keys")) store.put("cleanup", key, { key });
    appendEvents(store, old, [{ type: "session_reset", replacement_session_id: intent.initialization.sessionId,
      audience: ["dispatcher", "driver", "contributor", "viewer"] }], Date.now());
    intent.stage = "tombstoned";
    store.put("reset", "intent", intent);
    return intent.reply;
  });
}
function recover(record: ResetRecord, proof: Proof | undefined, env: PlatformBindings, now: number, digest: string): void {
  if (!proof || now >= record.replayUntil) fail(401, "CAPABILITY_EXPIRED");
  const actor = proof.tokenDigest === record.original.digest ? record.original : proof.tokenDigest === record.replacement.digest ? record.replacement : undefined;
  if (!actor) fail(401, "UNAUTHENTICATED");
  credentialCheck(actor, proof, env, false);
  if (proof.transport === "cookie" && (proof.origin !== env.WEB_ORIGIN || !proof.csrfDigest ||
    ![record.original.csrfDigest, record.replacement.csrfDigest].includes(proof.csrfDigest))) fail(403, "FORBIDDEN");
  if (record.digest !== digest) fail(409, "IDEMPOTENCY_KEY_REUSED");
}
