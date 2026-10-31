import { z } from "zod";
import { IdSchema } from "./id";

export const ClaimInputSchema = z.strictObject({
  "claim_token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long"),
  "client_type": z.literal(["web","native"]),
  "session_id": IdSchema,
});
export type ClaimInput = z.infer<typeof ClaimInputSchema>;
