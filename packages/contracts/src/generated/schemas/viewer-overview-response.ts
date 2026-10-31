import { z } from "zod";
import { MetaSchema } from "./meta";
import { ViewerOverviewSchema } from "./viewer-overview";

export const ViewerOverviewResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ViewerOverviewSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ViewerOverviewResponse = z.infer<typeof ViewerOverviewResponseSchema>;
