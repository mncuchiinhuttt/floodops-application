import { queryOptions, type UseQueryResult } from "@tanstack/react-query";
import type { OperationId, OperationInputs, Permission, Role } from "@floodops/contracts";
import { RequestCancelledError, type ClientResponse } from "@floodops/api-client";
import type { Resource } from "../shared/feature-state";
import type { WebRuntime } from "./runtime";
import { failureText } from "./failure";

export function readOptions<I extends OperationId>(runtime: WebRuntime, id: I, permission: Permission, role: Role, input: OperationInputs[I]) {
  const context = runtime.context(), principal = context.identity.participant, epoch = runtime.snapshot().epoch;
  return queryOptions({ queryKey: ["session", context.identity.session.session_id, context.identity.session.generation, principal.participant_id, id, input],
    queryFn: ({ signal }) => {
      if (signal.aborted || runtime.snapshot().epoch !== epoch || runtime.context().scope !== context.scope) throw new RequestCancelledError();
      return runtime.bound.read(id, permission, role, input, signal);
    },
  });
}
export function resourceOf<T>(query: UseQueryResult<ClientResponse<{ data: T }>>): Resource<T> {
  if (query.isError) return { status: "error", message: failureText(query.error) };
  if (!query.data) return { status: "loading" };
  return { status: "ready", data: query.data.body.data };
}
export async function refreshAfterCommand(runtime: WebRuntime): Promise<void> {
  await runtime.refresh(); await runtime.queries.invalidateQueries({ queryKey: ["session"] });
}
