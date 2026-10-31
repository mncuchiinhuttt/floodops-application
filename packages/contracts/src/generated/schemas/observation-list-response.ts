import { z } from "zod";
import { MetaSchema } from "./meta";
import { ObservationListSchema } from "./observation-list";

export const ObservationListResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ObservationListSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ObservationListResponse = z.infer<typeof ObservationListResponseSchema>;
