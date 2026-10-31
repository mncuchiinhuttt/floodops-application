import type { Permission, Role } from "@floodops/contracts";
const dispatcher: Permission[] = ["session:read", "scenario:read", "operations:read", "reports:submit", "reports:review", "media:write", "media:read", "knowledge:read", "knowledge:resolve", "sources:replay", "restrictions:apply", "planning:request", "planning:decide", "planning:execute", "simulation:advance", "simulation:reset", "results:read", "evaluation:run", "participants:invite", "participants:revoke", "simulation:submit_as"];
const roles: Record<Role, Permission[]> = {
  dispatcher, driver: ["session:read", "scenario:read", "driver:self:read", "reports:submit", "media:write", "media:read", "knowledge:read"],
  contributor: ["session:read", "scenario:read", "contributor:self:read", "reports:submit", "media:write", "media:read"],
  viewer: ["session:read", "scenario:read", "results:read"],
};
export function permissions(role: Role, owner = false): Permission[] {
  return [...roles[role], ...(owner ? ["manage_dispatchers", "session:delete"] as Permission[] : [])];
}
