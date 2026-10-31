import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";

export const CredentialDeliverySchema = z.strictObject({
  "client_type": z.literal(["web","native"]),
  "access_token": z.union([z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long"), z.null()]),
  "csrf_token": z.union([z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long"), z.null()]),
  "expires_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
}).describe("Web: HttpOnly cookie, access_token null. Native: bearer token in HTTPS response, csrf_token null. Never log this response; Cache-Control no-store.");
export type CredentialDelivery = z.infer<typeof CredentialDeliverySchema>;
