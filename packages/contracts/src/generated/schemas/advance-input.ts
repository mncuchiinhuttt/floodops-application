import { z } from "zod";

export const AdvanceInputSchema = z.strictObject({
  "target_sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
});
export type AdvanceInput = z.infer<typeof AdvanceInputSchema>;
