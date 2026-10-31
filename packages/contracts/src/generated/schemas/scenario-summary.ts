import { z } from "zod";
import { hasUniqueItems } from "../../schema-helpers";
import { CalibrationStatusSchema } from "./calibration-status";
import { IdSchema } from "./id";

export const ScenarioSummarySchema = z.strictObject({
  "scenario_id": IdSchema,
  "version": z.string().refine(v => [...v].length <= 80, "String too long"),
  "title": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "calibration_status": CalibrationStatusSchema,
  "cause_types": z.array(z.literal(["rain","high_tide","combined"])).refine(hasUniqueItems, "Duplicate items"),
  "supports_defer": z.boolean(),
  "supports_hub_change": z.boolean(),
  "supports_reroute_only": z.boolean(),
});
export type ScenarioSummary = z.infer<typeof ScenarioSummarySchema>;
