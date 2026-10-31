import { z } from "zod";
import { hasUniqueItems } from "../../schema-helpers";
import { IdSchema } from "./id";

export const DependencyGroupSchema = z.strictObject({
  "group_id": IdSchema,
  "action_ids": z.array(IdSchema).refine(v => v.length >= 1, "Too few items").refine(hasUniqueItems, "Duplicate items"),
  "depends_on_group_ids": z.array(IdSchema).refine(hasUniqueItems, "Duplicate items"),
});
export type DependencyGroup = z.infer<typeof DependencyGroupSchema>;
