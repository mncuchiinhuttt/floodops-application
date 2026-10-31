import { z } from "zod";

export const SimMinuteSchema = z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity.");
export type SimMinute = z.infer<typeof SimMinuteSchema>;
