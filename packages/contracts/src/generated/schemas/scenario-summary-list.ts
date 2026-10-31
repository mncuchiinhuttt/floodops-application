import { z } from "zod";
import { PageSchema } from "./page";
import { ScenarioSummarySchema } from "./scenario-summary";

export const ScenarioSummaryListSchema = z.strictObject({
  "items": z.array(ScenarioSummarySchema).refine(v => v.length <= 100, "Too many items"),
  "page": PageSchema,
});
export type ScenarioSummaryList = z.infer<typeof ScenarioSummaryListSchema>;
