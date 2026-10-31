import type { Participant, Permission, Role, SessionMeta } from "@floodops/contracts";

/** Supplied only after an authorized identity/session response; never a local persona picker. */
export interface MobileContext {
  session: SessionMeta;
  participant: Participant;
  nowMs: number;
  online: boolean;
  freshness: "current" | "stale" | "relink";
}
export function accessReason(context: MobileContext, permission: Permission, roles?: readonly Role[]): string | null {
  if (context.freshness === "relink" || ["reset", "resetting", "expired"].includes(context.session.status)) return "Rejoin the session with a current capability.";
  if (!Number.isFinite(context.nowMs) || !Number.isFinite(Date.parse(context.participant.expires_at)) ||
    !Number.isFinite(Date.parse(context.session.expires_at)) || context.nowMs >= Date.parse(context.participant.expires_at) ||
    context.nowMs >= Date.parse(context.session.expires_at)) return "Capability or session expired. Rejoin the session.";
  if (roles && !roles.includes(context.participant.role)) return "This workspace is outside your server capability.";
  if (!context.participant.permissions.includes(permission)) return `Missing permission: ${permission}.`;
  return null;
}
export function commandReason(context: MobileContext, permission: Permission, roles?: readonly Role[]): string | null {
  return accessReason(context, permission, roles) ?? (!context.online ? "Connection required. Commands are never queued offline."
    : context.freshness !== "current" ? "Refresh the current session before sending."
    : context.session.status !== "active" ? "Wait for the session to become active." : null);
}
export function sameSession(a: Pick<SessionMeta, "session_id" | "generation">, b: Pick<SessionMeta, "session_id" | "generation">): boolean {
  return a.session_id === b.session_id && a.generation === b.generation;
}
export interface WorkspaceLink { id: string; label: string; permission: Permission; roles: readonly Role[] }
const links: readonly WorkspaceLink[] = [
  { id: "driver", label: "My committed work", permission: "driver:self:read", roles: ["driver"] },
  { id: "contributor", label: "My reports and points", permission: "contributor:self:read", roles: ["contributor"] },
  { id: "report", label: "Send a report", permission: "reports:submit", roles: ["driver", "contributor"] },
  { id: "overview", label: "Overview and map", permission: "operations:read", roles: ["dispatcher"] },
  { id: "plan", label: "Plan and execution", permission: "operations:read", roles: ["dispatcher"] },
  { id: "sources", label: "Sources and conflicts", permission: "knowledge:read", roles: ["dispatcher"] },
  { id: "review", label: "Report review", permission: "reports:review", roles: ["dispatcher"] },
  { id: "timeline", label: "Timeline and clock", permission: "session:read", roles: ["dispatcher"] },
  { id: "results", label: "Simulation results", permission: "results:read", roles: ["dispatcher"] },
];
/** Navigation descriptors only. Expo Router bootstrap is a later integration slice. */
export function workspaceLinks(context: MobileContext): readonly WorkspaceLink[] {
  return links.filter(link => !accessReason(context, link.permission, link.roles));
}
