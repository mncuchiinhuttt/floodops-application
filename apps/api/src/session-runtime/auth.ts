import type { Permission } from "@floodops/contracts";
import { fail } from "../shared/platform-error";
import type { PlatformBindings, Proof, Snapshot, StoredParticipant } from "../shared/platform-types";
import { Store } from "./store";
export const IDLE_MS = 3_600_000;
export const MAX_AGE_MS = 86_400_000;
export function credentialCheck(record: StoredParticipant, proof: Proof | undefined, env: PlatformBindings, mutating: boolean): void {
  if (!proof || record.digest !== proof.tokenDigest || record.revoked) fail(401, "UNAUTHENTICATED");
  if ((record.transport === "web") !== (proof.transport === "cookie")) fail(401, "UNAUTHENTICATED");
  if (proof.origin !== null && proof.origin !== env.WEB_ORIGIN) fail(403, "FORBIDDEN");
  if (mutating && proof.transport === "cookie" && (proof.origin !== env.WEB_ORIGIN || !proof.csrfDigest || proof.csrfDigest !== record.csrfDigest)) fail(403, "FORBIDDEN");
}
export function authenticate(store: Store, snapshot: Snapshot, proof: Proof | undefined, env: PlatformBindings, now: number,
  mutating: boolean, permission?: Permission, allowRevoked = false): StoredParticipant {
  const record = proof ? store.get<StoredParticipant>("participants", proof.tokenDigest) : undefined;
  if (!record) fail(401, "UNAUTHENTICATED");
  credentialCheck(allowRevoked ? { ...record, revoked: false } : record, proof, env, mutating);
  if (now >= Date.parse(record.participant.expires_at)) fail(401, "CAPABILITY_EXPIRED");
  if (snapshot.meta.status === "expired" || now >= Date.parse(snapshot.meta.expires_at) || now >= snapshot.absoluteExpiry) fail(410, "SESSION_EXPIRED", snapshot);
  if (snapshot.meta.status === "reset") fail(410, "SESSION_RESET", snapshot);
  if (mutating && snapshot.meta.status === "resetting") fail(409, "STATE_CONFLICT", snapshot);
  if (permission && !record.participant.permissions.includes(permission)) fail(403, "FORBIDDEN");
  return record;
}
export function touch(store: Store, snapshot: Snapshot, now: number): void {
  snapshot.meta.expires_at = new Date(Math.min(now + IDLE_MS, snapshot.absoluteExpiry)).toISOString();
  store.save(snapshot);
}
export function requireCas(snapshot: Snapshot, value?: string | null): void {
  if (!value) fail(428, "PRECONDITION_REQUIRED", snapshot);
  const m = snapshot.meta;
  if (value !== `"s:${m.session_id}:g:${m.generation}:r:${m.revision}"`) fail(412, "REVISION_MISMATCH", snapshot);
}
