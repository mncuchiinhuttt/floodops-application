import { fail, success, PlatformError } from "../shared/platform-error";
import type { Call, PlatformBindings, Proof, Reply, RuntimeRegistry } from "../shared/platform-types";
import { authenticate, credentialCheck, touch } from "./auth";
import { eventPage } from "./events";
import { getView } from "./transitions";
import { participantPage } from "./pagination";
import { Store } from "./store";
export function readCall(store: Store, registry: RuntimeRegistry, env: PlatformBindings, call: Call, proof: Proof | undefined, now: number): Reply {
  const snapshot = store.snapshot();
  if (call.kind === "stream-close") {
    const record = proof ? store.get<import("../shared/platform-types").StoredParticipant>("participants", proof.tokenDigest) : undefined;
    if (!record) fail(401, "UNAUTHENTICATED");
    credentialCheck({ ...record, revoked: false }, proof, env, false);
    const stream = store.get<{ participant: string }>("streams", call.streamId!);
    if (stream?.participant === record.participant.participant_id) store.remove("streams", call.streamId!);
    return success(200, null, call.requestId);
  }
  const actor = authenticate(store, snapshot, proof, env, now, false, "session:read");
  let data: unknown;
  if (call.kind === "identity") data = { participant: actor.participant, session: snapshot.meta, csrf_token: proof?.derivedCsrf ?? null };
  else if (call.kind === "meta") data = snapshot.meta;
  else if (call.kind === "participants") {
    if (actor.participant.role !== "dispatcher") fail(403, "FORBIDDEN");
    data = participantPage(store, snapshot, call.payload);
  } else if (call.kind === "view") data = getView(store, registry, snapshot, actor, call.name!, now);
  else if (call.kind === "events" || call.kind === "stream-open" || call.kind === "stream-poll") {
    if (call.kind === "stream-open") {
      if (store.list("streams").length >= 5) throw new PlatformError(429, "RATE_LIMITED", "Stream limit", undefined, 15);
      store.put("streams", call.streamId!, { id: call.streamId!, participant: actor.participant.participant_id, expires: now + 60000 });
    }
    if (call.kind === "stream-poll") {
      const stream = store.get<{ participant: string; expires: number }>("streams", call.streamId!);
      if (!stream || stream.expires <= now || stream.participant !== actor.participant.participant_id) fail(401, "UNAUTHENTICATED");
    }
    data = eventPage(store, snapshot, actor, call.after!, call.limit ?? 500);
  } else fail(404, "NOT_FOUND");
  touch(store, snapshot, now);
  return success(200, data, call.requestId, snapshot);
}
