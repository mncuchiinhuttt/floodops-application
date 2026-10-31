import { parseSchema } from "@floodops/contracts";
import { fail, success } from "../shared/platform-error";
import type { Call, PlatformBindings, Proof, Reply, Snapshot, StoredParticipant } from "../shared/platform-types";
import { credentialCheck } from "./auth";
import { Store } from "./store";
/** One terminal notice for a pre-Reset registration; never a general reset-session read. */
export function resetStreamTerminal(store: Store, snapshot: Snapshot, env: PlatformBindings, call: Call, proof: Proof | undefined, now: number): Reply {
  if (call.kind !== "stream-poll" || snapshot.meta.status !== "reset") fail(410, "SESSION_RESET");
  const actor = proof ? store.get<StoredParticipant>("participants", proof.tokenDigest) : undefined;
  if (!actor) fail(401, "UNAUTHENTICATED");
  credentialCheck(actor, proof, env, false);
  if (now >= Date.parse(actor.participant.expires_at)) fail(401, "CAPABILITY_EXPIRED");
  if (now >= snapshot.absoluteExpiry || now >= Date.parse(snapshot.meta.expires_at)) fail(410, "SESSION_EXPIRED");
  if (!actor.participant.permissions.includes("session:read")) fail(403, "FORBIDDEN");
  const registration = store.get<{ participant: string; expires: number }>("streams", call.streamId!);
  if (!registration || registration.expires <= now || registration.participant !== actor.participant.participant_id) fail(401, "UNAUTHENTICATED");
  if (!Number.isSafeInteger(call.after) || call.after! < 0 || call.after! > snapshot.meta.event_sequence) fail(422, "INVALID_SCHEMA");
  const limit = call.limit ?? 500;
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) fail(422, "INVALID_SCHEMA");
  const row = store.storage.sql.exec<{ value: string }>("SELECT value FROM events WHERE json_extract(value,'$.type')='session_reset' ORDER BY sequence DESC LIMIT 1").toArray()[0];
  if (!row) fail(410, "SESSION_RESET", snapshot);
  const event = parseSchema("Event", JSON.parse(row.value));
  if (event.session_id !== snapshot.meta.session_id || event.generation !== snapshot.meta.generation ||
    event.replacement_session_id !== snapshot.values.replacement_session_id || event.replacement_session_id === null || call.after! >= event.event_sequence) fail(410, "SESSION_RESET", snapshot);
  store.remove("streams", call.streamId!);
  return success(200, { events: [event], next_sequence: event.event_sequence, has_more: false }, call.requestId, snapshot);
}
