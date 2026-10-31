import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { DraftPort } from "../report-draft";
import type { DraftNamespace } from "./file-draft-store";
export function privateDraftKey(owner: DraftNamespace) { return ["private-draft", owner.participantId, owner.session_id, owner.generation] as const; }
/** Filesystem-only query: independent of server event invalidation and available offline. */
export function usePrivateDraft(owner: DraftNamespace, storage: DraftPort) {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: privateDraftKey(owner), queryFn: () => storage.load(), networkMode: "always", retry: false,
    staleTime: Infinity, refetchOnWindowFocus: false, refetchOnReconnect: false });
  const port: DraftPort = { load: storage.load, save: async draft => {
    await storage.save(draft);
    await cache.invalidateQueries({ queryKey: privateDraftKey({ participantId: draft.participantId, session_id: draft.session_id, generation: draft.generation }) });
  } };
  return { query, port };
}
