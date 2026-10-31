import { SourceDomainError } from "@floodops/domain/sources";
import { PlatformError } from "../../shared/index";
import type { RuntimeRegistry } from "../../shared/index";
export function sourceDomain<T>(action: () => T): T {
  try { return action(); } catch (error) {
    if (!(error instanceof SourceDomainError)) throw error;
    if (error.code === "FORBIDDEN") throw new PlatformError(403, "FORBIDDEN");
    if (error.code === "UNKNOWN_SOURCE" || error.code === "UNKNOWN_SEGMENT") throw new PlatformError(404, "NOT_FOUND");
    if (["CONFIG_INCOMPLETE", "SOURCE_UNAVAILABLE", "SOURCE_SCOPE_INCOMPATIBLE"].includes(error.code)) throw new PlatformError(503, "CONFIG_INCOMPLETE");
    if (["STALE_EPOCH", "INVALID_TRANSITION"].includes(error.code)) throw new PlatformError(409, "STATE_CONFLICT");
    if (error.code === "INVALID_IMAGE" || error.code === "DUPLICATE_IMAGE") throw new PlatformError(422, error.code);
    throw new PlatformError(422, "INVALID_SCHEMA");
  }
}
export function adaptSourceRegistry(registry: RuntimeRegistry): RuntimeRegistry {
  return { ...registry, commands: Object.fromEntries(Object.entries(registry.commands ?? {}).map(([name, command]) =>
    [name, { ...command, reduce: (...args: Parameters<typeof command.reduce>) => sourceDomain(() => command.reduce(...args)) }])),
  views: Object.fromEntries(Object.entries(registry.views ?? {}).map(([name, view]) =>
    [name, { ...view, project: (...args: Parameters<typeof view.project>) => sourceDomain(() => view.project(...args)) }])) };
}
