import { z } from "zod";
import { MetaSchema } from "./meta";
import { ScenarioSummaryListSchema } from "./scenario-summary-list";

export const ScenarioSummaryListResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ScenarioSummaryListSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ScenarioSummaryListResponse = z.infer<typeof ScenarioSummaryListResponseSchema>;
