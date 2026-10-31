/** Synthetic adapter fixtures only; copy with tests into apps/mobile/test. */
import type { SessionCreated } from "@floodops/contracts";
import { fixtureContext } from "../preview/fixture-data";
import type { MobileContext } from "../src/shared/session-context";
export const now = Date.parse("2026-10-31T12:00:00Z");
export function delivery(context = fixtureContext("contributor"), token = "synthetic-native-bearer-00000000000000000001"): SessionCreated {
  return { session: context.session, participant: context.participant,
    credential: { client_type: "native", access_token: token, csrf_token: null, expires_at: "2026-11-01T00:00:00Z" } };
}
export function onlineMediaContext(): MobileContext {
  const context = fixtureContext("contributor");
  return { ...context, online: true, participant: { ...context.participant, permissions: [...context.participant.permissions, "media:write"] } };
}
export function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}
