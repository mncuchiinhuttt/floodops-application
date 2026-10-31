import { z } from "zod";
import { hasUniqueItems } from "../../schema-helpers";
import { IdSchema } from "./id";

export const ConflictResolutionInputSchema = z.strictObject({
  "keep_observation_ids": z.array(IdSchema).refine(v => v.length >= 1, "Too few items").refine(hasUniqueItems, "Duplicate items"),
  "supersede_observation_ids": z.array(IdSchema).refine(v => v.length >= 1, "Too few items").refine(hasUniqueItems, "Duplicate items"),
  "reason": z.string().refine(v => [...v].length <= 2000, "String too long"),
});
export type ConflictResolutionInput = z.infer<typeof ConflictResolutionInputSchema>;
