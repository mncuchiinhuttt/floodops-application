import type { Graph, InputEvent, Observation, Parameter, Restriction, Source, SourceFixture, SourcePolicyProfile } from "@floodops/contracts";

export interface SourceRegistry {
  readonly sources: readonly Source[];
  readonly profiles: readonly SourcePolicyProfile[];
  readonly parameters: readonly Parameter[];
}
export interface SourceEnvironment extends SourceRegistry {
  readonly graph: Graph;
  readonly t0: string;
  readonly nowSimMinute: number;
}
export interface EvidenceContext extends SourceEnvironment {
  readonly observations: readonly Observation[];
  readonly restrictions: readonly Restriction[];
  readonly inputEvents: readonly InputEvent[];
  readonly sourceFixtures: readonly SourceFixture[];
}
export type SourceFailure = "INVALID_SCHEMA" | "CONFIG_INCOMPLETE" | "UNKNOWN_SOURCE" | "SOURCE_UNAVAILABLE"
  | "SOURCE_ROLE_MISMATCH" | "UNSUPPORTED_UNIT" | "INVALID_TIME" | "UNKNOWN_SEGMENT" | "LOCATION_MISMATCH"
  | "NEEDS_CLARIFICATION" | "FORBIDDEN" | "FUTURE_CAPTURE" | "EXPIRED" | "INVALID_IMAGE"
  | "DUPLICATE_IMAGE" | "STALE_EPOCH" | "INVALID_TRANSITION" | "SOURCE_SCOPE_INCOMPATIBLE";
export class SourceDomainError extends Error {
  constructor(readonly code: SourceFailure) { super(code); this.name = "SourceDomainError"; }
}
export function fail(code: SourceFailure): never { throw new SourceDomainError(code); }
export function uniqueIds(items: readonly string[]): void {
  if (new Set(items).size !== items.length) fail("INVALID_SCHEMA");
}
