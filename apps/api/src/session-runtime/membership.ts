import { parseSchema, type InviteInput, type Participant } from "@floodops/contracts";
import { fail, success } from "../shared/platform-error";
import type { Call, PlatformBindings, Proof, Reply, Snapshot, StoredParticipant } from "../shared/platform-types";
import { authenticate, credentialCheck, touch, requireCas } from "./auth";
import { created, type Credentials } from "./credentials";
import { appendEvents } from "./events";
import { expireSession } from "./lifecycle";
import { rateLimit } from "./quotas";
import { Store } from "./store";
export interface StoredInvite { invite_id: string; role: Participant["role"]; bound_entity_id: string | null; expires_at: string; claimed: boolean }
export interface InvitationMaterial { digest: string; invite: StoredInvite; delivery: NonNullable<Reply["credential"]> }
export function membership(store: Store, env: PlatformBindings, call: Call, proof: Proof | undefined,
  digest: string, now: number, invitation?: InvitationMaterial): Reply {
  const snapshot = store.snapshot();
  if (call.kind === "delete" && proof) {
    const original = store.get<StoredParticipant>("participants", proof.tokenDigest);
    if (original && now < Date.parse(original.participant.expires_at)) {
      credentialCheck(original, proof, env, true);
      if (original.participant.permissions.includes("session:delete")) {
        const replay = store.replay(original.participant.participant_id, call.key!, digest);
        if (replay) return replay;
      }
    }
  }
  const permission = call.kind === "invite" ? "participants:invite" : call.kind === "revoke" ? "participants:revoke" : call.kind === "delete" ? "session:delete" : undefined;
  const actor = authenticate(store, snapshot, proof, env, now, true, permission, call.kind === "logout");
  const replay = store.replay(actor.participant.participant_id, call.key!, digest);
  if (replay) return replay;
  if (actor.revoked) fail(401, "UNAUTHENTICATED");
  rateLimit(store, actor, now);
  let data: unknown = null;
  let status = 200;
  let credential: Reply["credential"];
  if (call.kind === "invite") {
    const input = parseSchema("InviteInput", call.payload);
    validateInvitation(input, actor, snapshot);
    if (!invitation) fail(503, "STORAGE_UNAVAILABLE");
    if (store.list("invitations").length >= 100) fail(429, "RATE_LIMITED");
    store.put("invitations", invitation.digest, invitation.invite);
    data = { invite_id: invitation.invite.invite_id, role: invitation.invite.role, bound_entity_id: invitation.invite.bound_entity_id, expires_at: invitation.invite.expires_at };
    credential = invitation.delivery;
    status = 201;
  } else if (call.kind === "logout" || call.kind === "revoke") {
    const target = call.kind === "logout" ? actor : store.list<StoredParticipant>("participants").find(r => r.participant.participant_id === call.name);
    if (!target) fail(404, "NOT_FOUND");
    if (target.participant.is_owner && !actor.participant.is_owner) fail(403, "FORBIDDEN");
    target.revoked = true;
    store.put("participants", target.digest, target);
    data = { participant_id: target.participant.participant_id, revoked: true };
    appendEvents(store, snapshot, [{ type: "capability_revoked", resource_ids: [target.participant.participant_id], participantIds: [target.participant.participant_id] }], now);
    if (call.kind === "logout") status = 204;
  } else if (call.kind === "delete") {
    requireCas(snapshot, call.ifMatch);
    expireSession(store, snapshot, now);
    data = { session_id: snapshot.meta.session_id, status: "expired" };
  } else fail(404, "NOT_FOUND");
  if (call.kind !== "delete") touch(store, snapshot, now);
  const reply: Reply = { ...success(status, data, call.requestId, snapshot), credential, clearCookie: call.kind === "logout" };
  store.remember(actor.participant.participant_id, call.key!, digest, reply);
  return reply;
}
function validateInvitation(input: InviteInput, actor: StoredParticipant, snapshot: Snapshot): void {
  if (input.role === "dispatcher" && !actor.participant.permissions.includes("manage_dispatchers")) fail(403, "FORBIDDEN");
  if (input.role === "driver" || input.role === "contributor") {
    if (!input.bound_entity_id || !snapshot.seed.entities[input.role].includes(input.bound_entity_id)) fail(422, "UNKNOWN_ENTITY");
  } else if (input.bound_entity_id !== null) fail(422, "INVALID_SCHEMA");
}
export function claim(store: Store, call: Call, tokenDigest: string, digest: string, credentials: Credentials, now: number): Reply {
  const snapshot = store.snapshot();
  const invite = store.get<StoredInvite>("invitations", tokenDigest);
  if (!invite) fail(401, "UNAUTHENTICATED");
  if (snapshot.meta.status === "reset") fail(410, "SESSION_RESET", snapshot);
  if (snapshot.meta.status === "expired") fail(410, "SESSION_EXPIRED", snapshot);
  if (snapshot.meta.status === "resetting") fail(409, "STATE_CONFLICT", snapshot);
  const replay = store.replay(`claim:${tokenDigest}`, call.key!, digest);
  if (replay) return replay;
  if (invite.claimed || now >= Date.parse(invite.expires_at)) fail(401, "UNAUTHENTICATED");
  invite.claimed = true;
  credentials.record.participant = { ...credentials.record.participant, role: invite.role, bound_entity_id: invite.bound_entity_id };
  // Permissions are issued from the invitation, never the caller-selected role.
  store.put("invitations", tokenDigest, invite);
  store.put("participants", credentials.record.digest, credentials.record);
  touch(store, snapshot, now);
  const reply: Reply = { ...success(201, created(snapshot, credentials), call.requestId, snapshot), credential: credentials.delivery };
  store.remember(`claim:${tokenDigest}`, call.key!, digest, reply);
  return reply;
}
