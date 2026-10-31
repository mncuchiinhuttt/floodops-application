import { z } from "zod";
import { MetaSchema } from "./meta";
import { SimulationClockSchema } from "./simulation-clock";

export const SimulationClockResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": SimulationClockSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type SimulationClockResponse = z.infer<typeof SimulationClockResponseSchema>;
