export { normalizeInput } from "./normalize-input.ts";
export { normalizeMeasurement, simTimestamp, assertMappedTime } from "./source-time.ts";
export { sourceFor, profileFor, validateRegistry } from "./source-policy.ts";
export { resolveReportLocation, distanceToPolyline } from "./location.ts";
export { SourceDomainError } from "./source-types.ts";
export type { SourceRegistry, SourceEnvironment, EvidenceContext, SourceFailure } from "./source-types.ts";
