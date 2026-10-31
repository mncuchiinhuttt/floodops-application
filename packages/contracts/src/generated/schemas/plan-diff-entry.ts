import { z } from "zod";
import { IdSchema } from "./id";

export const PlanDiffEntrySchema = z.strictObject({
  "entity_id": IdSchema,
  "change": z.literal(["added","removed","changed"]),
  "before_eta_minute": z.union([z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."), z.null()]),
  "after_eta_minute": z.union([z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."), z.null()]),
  "reason": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "evidence_ids": z.array(IdSchema),
});
export type PlanDiffEntry = z.infer<typeof PlanDiffEntrySchema>;
