import { expect, it } from "vitest";
import app from "../../apps/api/src/index";
import { summarizeRouteRegistration } from "./route-coverage";
const result = summarizeRouteRegistration(app.routes);
it(`inventories actual production composition: ${result.registered_operations}/${result.contract_operations} registered, not functional acceptance`, () => {
  const mounted = new Set(result.inventory.filter(op => op.registered_handlers).map(op => op.operation_id));
  for (const id of ["getHealth", "createSession", "claimSession", "getSession", "getIdentity", "createInvitation", "listParticipants", "revokeParticipant", "logout", "deleteSession", "resetSession", "getEvents", "streamEvents"] as const) expect(mounted.has(id)).toBe(true);
  expect(result.contract_operations).toBe(66);
  expect(result.uncontracted_routes).toEqual([]);
  console.info("API_REGISTRATION_INVENTORY " + JSON.stringify(result));
});
