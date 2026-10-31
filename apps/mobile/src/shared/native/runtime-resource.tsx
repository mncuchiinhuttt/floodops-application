import type { ReactNode } from "react";
import type { ApiClient, RequestOptions } from "@floodops/api-client";
import { RequestScope } from "@floodops/api-client";
import type { Meta } from "@floodops/contracts";
import { Alert, Skeleton } from "@floodops/ui-native";
import { useNativeRuntime } from "../../features/session/runtime/native-runtime";
import type { MobileContext } from "../session-context";
import { ScreenFrame } from "../screen-frame";
import { useNativeQuery } from "./use-native-query";
import type { QueryState } from "../query-state";
export type ResourceRead<T> = (api: ApiClient, options: RequestOptions) => Promise<{ value: T; meta: Meta }>;
export function useResource<T>(context: MobileContext, key: readonly unknown[], read: ResourceRead<T>, poll = false): QueryState<T> {
  const { service } = useNativeRuntime();
  return useNativeQuery(context, key, async signal => {
    const scope = new RequestScope(context.session.session_id, context.session.generation);
    try {
      const result = await read(service.api, { scope, signal });
      if (result.meta.session_id !== context.session.session_id || result.meta.generation !== context.session.generation) throw new Error("Resource session mismatch");
      return { value: result.value, session: { ...context.session, revision: result.meta.revision ?? context.session.revision, event_sequence: result.meta.event_sequence ?? context.session.event_sequence } };
    } finally { scope.cancel(); }
  }, poll);
}
export function ResourceBoundary<T>({ title, context, query, children }: { title: string; context: MobileContext; query: QueryState<T>; children: (value: T) => ReactNode }) {
  if (query.data === null || query.status === "error" || query.status === "relink") return <ScreenFrame title={title} context={context}>
    {query.status === "loading" ? <Skeleton label="Reading authorized server data" /> : <Alert title="Server view unavailable">{query.message ?? "No current server data. Reconnect or refresh explicitly."}</Alert>}
  </ScreenFrame>;
  return children(query.data);
}

export function commandContext<T>(context: MobileContext, query: QueryState<T>): MobileContext {
  return query.status !== "ready" || query.revision < context.session.revision || query.event_sequence < context.session.event_sequence
    ? { ...context, freshness: "stale" } : context;
}
