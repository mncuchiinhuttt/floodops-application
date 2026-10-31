import { z } from "zod";
import { MetaSchema } from "./meta";
import { ScenarioConfigSchema } from "./scenario-config";

export const ScenarioConfigResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ScenarioConfigSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ScenarioConfigResponse = z.infer<typeof ScenarioConfigResponseSchema>;
