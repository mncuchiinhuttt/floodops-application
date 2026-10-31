import { parseSchema } from "@floodops/contracts";
import { fail } from "../../shared/index";
import { casInput } from "./runtime-context";
export function planInput(raw: unknown) {
  const envelope = casInput(raw);
  if (!envelope.input || typeof envelope.input !== "object" || Array.isArray(envelope.input)) fail(422, "INVALID_SCHEMA");
  const body = envelope.input as Record<string, unknown>;
  if (Object.keys(body).sort().join(",") !== "plan_id,request") fail(422, "INVALID_SCHEMA");
  return { ...envelope, planId: parseSchema("Id", body.plan_id), request: body.request };
}
