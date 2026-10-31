import type { Event } from "@floodops/contracts";
import { fail, success } from "../shared/platform-error";
import type { Call, Proof, Reply, RuntimeRegistry, Snapshot, StoredParticipant } from "../shared/platform-types";
import { authenticate, requireCas, touch } from "./auth";
import { appendEvents } from "./events";
import type { PlatformBindings } from "../shared/platform-types";
import { rateLimit } from "./quotas";
import { reconcileImages } from "./image-jobs";
import { assertFence, updateLeases, reconcileLeases } from "./leases";
import { Store } from "./store";
export function command(store: Store, registry: RuntimeRegistry, env: PlatformBindings, call: Call, proof: Proof | undefined, digest: string, now: number, nonceDigest?: string): Reply {
  const snapshot = store.snapshot();
  const definition = registry.commands?.[call.name ?? ""];
  if (!definition) fail(404, "NOT_FOUND");
  const actor = authenticate(store, snapshot, proof, env, now, true, definition.permission);
  const input = definition.validate(call.payload);
  const replay = store.replay(actor.participant.participant_id, call.key!, digest);
  if (replay) return replay;
  rateLimit(store, actor, now);
  assertFence(snapshot, call, now, nonceDigest);
  if (definition.operational) requireCas(snapshot, call.ifMatch);
  const transition = definition.reduce({ snapshot: structuredClone(snapshot), actor: { participant: actor.participant }, now }, input);
  if (transition && typeof (transition as unknown as { then?: unknown }).then === "function") fail(503, "CONFIG_INCOMPLETE");
  updateLeases(snapshot, transition, registry);
  if (transition.values) snapshot.values = transition.values;
  if (transition.status) snapshot.meta.status = transition.status;
  if (transition.simMinute !== undefined) snapshot.meta.sim_minute = transition.simMinute;
  if (definition.operational) snapshot.meta.revision++;
  for (const key of transition.mediaKeys ?? []) registerCleanup(store, snapshot, key);
  for (const key of transition.cleanupKeys ?? []) {
    registerCleanup(store, snapshot, key); store.put("cleanup", key, { key });
  }
  const role = actor.participant.role;
  const eventActor: Event["actor"] = role === "contributor" ? "community" : role === "viewer" ? "system" : role;
  appendEvents(store, snapshot, transition.events ?? [{ type: "state_changed" }], now, eventActor);
  reconcileLeases(store, registry, now); reconcileImages(store, registry, now);
  const committed = store.snapshot();
  touch(store, committed, now);
  const result = success(200, transition.data, call.requestId, committed);
  store.remember(actor.participant.participant_id, call.key!, digest, result);
  return result;
}
export function registerCleanup(store: Store, snapshot: Snapshot, key: string): void {
  if (!key.startsWith(`sessions/${snapshot.meta.session_id}/`) || key.includes("..")) fail(422, "INVALID_SCHEMA");
  store.put("media_keys", key, key);
}
export function getView(store: Store, registry: RuntimeRegistry, snapshot: Snapshot, participant: StoredParticipant, name: string, now: number): unknown {
  const roles: Record<string, string[]> = { snapshot: ["dispatcher"], overview: ["dispatcher", "viewer"], "driver-dashboard": ["driver"], "contributor-dashboard": ["contributor"] };
  if (roles[name] && !roles[name].includes(participant.participant.role)) fail(403, "FORBIDDEN");
  const view = registry.views?.[name];
  if (!view) fail(503, "CONFIG_INCOMPLETE");
  if (!view.roles.includes(participant.participant.role) || !participant.participant.permissions.includes(view.permission)) fail(403, "FORBIDDEN");
  return view.project({ snapshot: structuredClone(snapshot), actor: { participant: participant.participant }, now });
}
