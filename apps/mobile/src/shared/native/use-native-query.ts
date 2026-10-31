import { useQuery } from "@tanstack/react-query";
import type { SessionMeta } from "@floodops/contracts";
import { initialQuery, type QueryState } from "../query-state";
import { clientFailure } from "../client-failure";
import type { MobileContext } from "../session-context";
export function useNativeQuery<T>(context: MobileContext, key: readonly unknown[], read: (signal: AbortSignal) => Promise<{ value: T; session: SessionMeta }>, poll = false): QueryState<T> {
  const query = useQuery({ queryKey: ["native", context.session.session_id, context.session.generation, context.participant.participant_id, ...key],
    queryFn: ({ signal }) => read(signal), enabled: context.online, retry: false,
    refetchInterval: context.online && poll ? 2000 : false });
  const value = query.data;
  return { ...initialQuery<T>(context.session), ...(value ? { revision: value.session.revision, event_sequence: value.session.event_sequence, data: value.value } : {}),
    status: !context.online ? "offline" : query.isError ? "error" : query.isPending || query.isFetching ? "loading" : "ready",
    message: query.isError ? clientFailure(query.error).message : null };
}
