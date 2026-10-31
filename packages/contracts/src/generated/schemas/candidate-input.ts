import { z } from "zod";
import { hasUniqueItems } from "../../schema-helpers";
import { IdSchema } from "./id";

export const CandidateInputSchema = z.strictObject({
  "group_ids": z.array(IdSchema).refine(v => v.length >= 1, "Too few items").refine(hasUniqueItems, "Duplicate items"),
});
export type CandidateInput = z.infer<typeof CandidateInputSchema>;
