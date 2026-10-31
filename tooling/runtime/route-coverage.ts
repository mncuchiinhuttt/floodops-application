import { operations } from "@floodops/contracts";
export interface RegisteredRoute { method: string; path: string }
const methods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]);
function routeKey(method: string, path: string): string | null {
  if (!methods.has(method.toUpperCase()) || /[*?()]/.test(path)) return null;
  const canonical = path.replace(/(^|\/):[A-Za-z_][A-Za-z0-9_]*(?=\/|$)/g, "$1{}").replace(/\{[A-Za-z_][A-Za-z0-9_]*\}/g, "{}");
  return method.toUpperCase() + " " + canonical;
}
/** Router registration evidence only; no claim of authorization or working business behavior. */
export function summarizeRouteRegistration(routes: readonly RegisteredRoute[]) {
  const keys = routes.map(route => routeKey(route.method, route.path)).filter((key): key is string => key !== null);
  const expected = new Set(Object.values(operations).map(op => routeKey(op.method, "/api/v1" + op.path)!));
  const inventory = Object.values(operations).map(op => ({
    operation_id: op.id, method: op.method, path: "/api/v1" + op.path,
    registered_handlers: keys.filter(key => key === routeKey(op.method, "/api/v1" + op.path)).length
  }));
  return { contract_operations: inventory.length,
    registered_operations: inventory.filter(op => op.registered_handlers > 0).length,
    unmounted_operations: inventory.filter(op => op.registered_handlers === 0).map(op => op.operation_id),
    uncontracted_routes: [...new Set(keys.filter(key => !expected.has(key)))].sort(),
    inventory,
    qualification: "Registration is not implementation, successful execution, feature acceptance or backend-ready. ALL/wildcard middleware never counts as a contract operation." };
}
export function requireCompleteRouteRegistration(summary: ReturnType<typeof summarizeRouteRegistration>): void {
  if (summary.unmounted_operations.length || summary.uncontracted_routes.length) {
    throw new Error("Incomplete API registration: " + summary.unmounted_operations.join(", ")
      + "; uncontracted: " + summary.uncontracted_routes.join(", "));
  }
}
