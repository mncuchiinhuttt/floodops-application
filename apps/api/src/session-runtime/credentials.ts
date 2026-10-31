import type { Participant, SessionCreated } from "@floodops/contracts";
import { hash, randomId, randomToken, seal, stable } from "../shared/crypto";
import type { PlatformBindings, Reply, Snapshot, StoredParticipant } from "../shared/platform-types";
import { permissions } from "./permissions";
export interface Credentials { record: StoredParticipant; delivery: NonNullable<Reply["credential"]> }
export async function issueCredentials(env: PlatformBindings, sessionId: string, key: string, digest: string,
  role: Participant["role"], entity: string | null, owner: boolean, clientType: "web" | "native", expires: number): Promise<Credentials> {
  const token = randomToken();
  const csrf = clientType === "web" ? await hash(`csrf:${token}`) : null;
  const participant: Participant = { participant_id: randomId("participant"), role, bound_entity_id: entity, is_owner: owner,
    permissions: permissions(role, owner), expires_at: new Date(expires).toISOString() };
  const aad = stable([sessionId, participant.participant_id, key, digest]);
  return { record: { participant, digest: await hash(token), csrfDigest: csrf ? await hash(csrf) : null, transport: clientType, revoked: false },
    delivery: { box: await seal(env, { token, csrf }, aad), aad, type: clientType } };
}
export function created(snapshot: Snapshot, credentials: Credentials): SessionCreated {
  return { session: snapshot.meta, participant: credentials.record.participant,
    credential: { client_type: credentials.record.transport, access_token: null, csrf_token: null, expires_at: credentials.record.participant.expires_at } };
}
