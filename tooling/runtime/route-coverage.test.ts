import { expect, test } from "bun:test";
import { operations } from "@floodops/contracts";
import { requireCompleteRouteRegistration, summarizeRouteRegistration } from "./route-coverage";
test("does not mistake ALL/wildcard middleware or a missing API prefix for implemented operations", () => {
  const result = summarizeRouteRegistration([{ method: "ALL", path: "*" }, { method: "GET", path: "/api/v1/*" }, { method: "GET", path: "/health" }]);
  expect(result.registered_operations).toBe(0);
  expect(result.unmounted_operations).toHaveLength(66);
  expect(result.uncontracted_routes).toEqual(["GET /health"]);
  expect(() => requireCompleteRouteRegistration(result)).toThrow("Incomplete API registration");
});
test("matches methods and structural parameters without crediting the wrong operation", () => {
  const result = summarizeRouteRegistration([{ method: "get", path: "/api/v1/sessions/:id" }, { method: "POST", path: "/api/v1/sessions/:id" }]);
  expect(result.registered_operations).toBe(1);
  expect(result.inventory.find(op => op.operation_id === "getSession")?.registered_handlers).toBe(1);
  expect(result.uncontracted_routes).toEqual(["POST /api/v1/sessions/{}"]);
});
test("multiple middleware/handler functions do not inflate operation count", () => {
  const result = summarizeRouteRegistration([{ method: "GET", path: "/api/v1/health" }, { method: "GET", path: "/api/v1/health" }]);
  expect(result.registered_operations).toBe(1);
  expect(result.inventory.find(op => op.operation_id === "getHealth")?.registered_handlers).toBe(2);
});
test("complete exact contract registration passes only the registration guard", () => {
  const result = summarizeRouteRegistration(Object.values(operations).map(op => ({ method: op.method, path: "/api/v1" + op.path })));
  expect(result.registered_operations).toBe(66);
  expect(result.uncontracted_routes).toEqual([]);
  expect(() => requireCompleteRouteRegistration(result)).not.toThrow();
  expect(result.qualification).toContain("not implementation");
});
