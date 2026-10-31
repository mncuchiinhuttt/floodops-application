import { IdentitySchema, formatEtag, operations, type OperationId, type Permission, type Role } from "@floodops/contracts";
import { ApiClient, ApiError, RequestScope, type OperationInputs } from "@floodops/api-client";
import { accessReason, sameSession, sameVersion, type AccessContext } from "./access";

export interface ClientContext extends AccessContext { scope: RequestScope }
export class FeatureAccessError extends Error {}
export function createBoundClient(client: ApiClient, readContext: () => ClientContext, onAuthorityFailure?: (context: ClientContext) => void) {
  function snapshot(permission: Permission, role: Role, command: boolean) {
    const context = readContext();
    const reason = accessReason(context, permission, role, command);
    const session = context.identity.session;
    if (reason || context.scope.signal.aborted || context.scope.sessionId !== session.session_id || context.scope.generation !== session.generation)
      throw new FeatureAccessError(reason ?? "Phiên đã thay đổi. Cần ghép nối lại.");
    return { ...context, identity: IdentitySchema.parse(context.identity) };
  }
  return {
    async read<I extends OperationId>(id: I, permission: Permission, role: Role, input: OperationInputs[I], signal?: AbortSignal) {
      const context = snapshot(permission, role, false);
      if (!operations[id].roles.some(value => value === role)) throw new FeatureAccessError("Operation không thuộc role này.");
      try { return await client.request(id, input, { scope: context.scope, signal }); }
      catch (error) {
        if (error instanceof ApiError && [401, 403, 410].includes(error.status)) onAuthorityFailure?.(context);
        throw error;
      }
    },
    prepare<I extends OperationId>(id: I, permission: Permission, role: Role,
      input: (context: ClientContext) => OperationInputs[I]) {
      const captured = snapshot(permission, role, true);
      if (!operations[id].roles.some(value => value === role)) throw new FeatureAccessError("Operation không thuộc role này.");
      const request = client.prepare(id, input(captured));
      let invalidated = false;
      return { operationId: request.operationId, idempotencyKey: request.idempotencyKey, send: async (options: { signal?: AbortSignal } = {}) => {
        if (invalidated) throw new FeatureAccessError("Needs replan — lệnh cũ bị vô hiệu. Làm mới và xem lại.");
        const current = snapshot(permission, role, true);
        if (current.scope !== captured.scope || !sameSession(current.identity.session, captured.identity.session) ||
          (operations[id].requiresRevision && !sameVersion(current.identity.session, captured.identity.session)) ||
          current.identity.participant.participant_id !== captured.identity.participant.participant_id ||
          current.identity.participant.bound_entity_id !== captured.identity.participant.bound_entity_id ||
          current.identity.participant.role !== captured.identity.participant.role)
          throw new FeatureAccessError("Lệnh cũ. Làm mới và xem lại trước khi gửi.");
        try { return await request.send({ scope: captured.scope, signal: options.signal }); }
        catch (error) {
          if (error instanceof ApiError && [401, 403, 410, 412].includes(error.status)) {
            invalidated = true; if (error.status !== 412) onAuthorityFailure?.(captured);
          }
          throw error;
        }
      } };
    },
    sessionId: () => readContext().identity.session.session_id,
    headers: (context: ClientContext, key: string) => ({
      "If-Match": formatEtag(context.identity.session), "Idempotency-Key": key,
    }),
  };
}
export type BoundClient = ReturnType<typeof createBoundClient>;
