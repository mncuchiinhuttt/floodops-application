import { parseOperationInput } from "@floodops/contracts";
import { fail } from "../shared/platform-error";
import type { Snapshot, StoredParticipant } from "../shared/platform-types";
import { Store } from "./store";
export function participantPage(store: Store, snapshot: Snapshot, query: unknown): unknown {
  const input = parseOperationInput("listParticipants", { path: { session_id: snapshot.meta.session_id }, query: query ?? {} });
  const limit = input.query?.limit ?? 50; const cursor = input.query?.cursor;
  let after = "";
  if (cursor) {
    try {
      const parsed = JSON.parse(atob(cursor)) as string[];
      if (parsed.length !== 4 || parsed[0] !== snapshot.meta.session_id || parsed[1] !== String(snapshot.meta.generation) || parsed[2] !== "participants" || typeof parsed[3] !== "string") fail(422, "INVALID_SCHEMA");
      after = parsed[3];
    } catch { fail(422, "INVALID_SCHEMA"); }
  }
  const all = store.list<StoredParticipant>("participants").map(p => p.participant).sort((a, b) => (a.participant_id < b.participant_id ? -1 : a.participant_id > b.participant_id ? 1 : 0)).filter(p => p.participant_id > after);
  const items = all.slice(0, limit); const hasMore = all.length > items.length;
  return { items, page: { has_more: hasMore, next_cursor: hasMore ? btoa(JSON.stringify([snapshot.meta.session_id, String(snapshot.meta.generation), "participants", items.at(-1)!.participant_id])) : null } };
}
