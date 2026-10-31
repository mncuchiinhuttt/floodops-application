import { expect, test } from "bun:test";
import { parseSchema } from "@floodops/contracts";
import type { ErrorCode } from "@floodops/contracts";
import { SourceDomainError } from "@floodops/domain/sources";
import type { SourceFailure } from "@floodops/domain/sources";
import { errorReply, PlatformError } from "../../src/shared/index";
import { sourceFailure } from "../../src/features/reports/review/state";

const cases: [SourceFailure, number, ErrorCode][] = [
  ["CONFIG_INCOMPLETE", 503, "CONFIG_INCOMPLETE"], ["FORBIDDEN", 403, "FORBIDDEN"],
  ["DUPLICATE_IMAGE", 422, "DUPLICATE_IMAGE"], ["INVALID_IMAGE", 422, "INVALID_IMAGE"],
  ["INVALID_SCHEMA", 422, "INVALID_SCHEMA"], ["STALE_EPOCH", 409, "STATE_CONFLICT"],
  ["EXPIRED", 409, "STATE_CONFLICT"], ["INVALID_TRANSITION", 409, "STATE_CONFLICT"],
];
test.each(cases)("public Source error %s preserves HTTP %s and canonical %s", (code, status, publicCode) => {
  let caught: unknown;
  try { sourceFailure(new SourceDomainError(code)); } catch (error) { caught = error; }
  expect(caught).toBeInstanceOf(PlatformError);
  const reply = errorReply(caught, "request_source_compat_v4");
  expect(reply.status).toBe(status);
  const body = parseSchema("ErrorResponse", reply.body);
  expect(body.error?.code).toBe(publicCode); expect(body.error?.message).toBe(publicCode);
  expect(body.success).toBeFalse(); expect(body.data).toBeNull();
});
test("unrelated exceptions retain identity for the platform boundary", () => {
  const unexpected = new Error("Synthetic unexpected failure");
  let caught: unknown;
  try { sourceFailure(unexpected); } catch (error) { caught = error; }
  expect(caught).toBe(unexpected);
});
