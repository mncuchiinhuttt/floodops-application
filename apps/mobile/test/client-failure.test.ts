import { ApiError, TransportError } from "@floodops/api-client";
import { clientFailure } from "../src/shared/client-failure";
import type { ErrorCode } from "@floodops/contracts";
function failure(status: number, code: ErrorCode) {
  return new ApiError(status, { success: false, data: null, error: { code, message: "Synthetic server reason", details: [], retryable: false, current_revision: 4, replacement_session_id: null }, meta: { request_id: "fixture-error" } }, null);
}
test("412 requires explicit replan, 409 inspection, 403 rejoin and validation preserves input", () => {
  expect(clientFailure(failure(412, "REVISION_MISMATCH")).next).toBe("replan");
  expect(clientFailure(failure(409, "STATE_CONFLICT")).next).toBe("inspect");
  expect(clientFailure(failure(403, "FORBIDDEN")).next).toBe("rejoin");
  expect(clientFailure(failure(422, "INVALID_IMAGE"))).toEqual({ message: "Server validation: INVALID_IMAGE. Input is preserved.", next: "correct" });
  expect(clientFailure(new TransportError()).message).toContain("outcome is uncertain");
});
