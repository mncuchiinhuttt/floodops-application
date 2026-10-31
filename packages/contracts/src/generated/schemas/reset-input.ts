import { z } from "zod";

export const ResetInputSchema = z.strictObject({
  "client_type": z.literal(["web","native"]),
  "confirm": z.literal(true),
});
export type ResetInput = z.infer<typeof ResetInputSchema>;
