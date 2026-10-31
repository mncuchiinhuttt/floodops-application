import type { CandidateAssignment, Driver, Hub, Order, Stop } from "@floodops/contracts";

/** Pure operational snapshot. Persistence/auth/revision/Execute belong to their owners. */
export interface OperationState {
  readonly orders: readonly Order[];
  readonly drivers: readonly Driver[];
  readonly hubs: readonly Hub[];
  readonly deferredUntilMinute: Readonly<Record<string, number>>;
}
export interface AssignmentCandidate {
  readonly assignments: readonly CandidateAssignment[];
  readonly stopsByDriver: Readonly<Record<string, readonly Stop[]>>;
}
export class OperationError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = "OperationError"; }
}
export function cloneOperations(state: OperationState): OperationState { return structuredClone(state); }
export function freezeValue<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeValue);
    Object.freeze(value);
  }
  return value;
}
export function uniqueIds(ids: readonly string[], label: string): void {
  if (ids.some(id => !id.trim()) || new Set(ids).size !== ids.length) {
    throw new OperationError("INVALID_REFERENCE", `Duplicate/empty ${label}.`);
  }
}
