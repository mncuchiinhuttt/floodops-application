import { z } from "zod";
import { OperationalBranchSchema } from "./operational-branch";

export const OperationsSchema = z.strictObject({
  "branches": z.array(OperationalBranchSchema).refine(v => v.length >= 2, "Too few items").refine(v => v.length <= 3, "Too many items"),
});
export type Operations = z.infer<typeof OperationsSchema>;
