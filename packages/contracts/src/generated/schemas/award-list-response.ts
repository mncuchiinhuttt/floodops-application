import { z } from "zod";
import { AwardListSchema } from "./award-list";
import { MetaSchema } from "./meta";

export const AwardListResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": AwardListSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type AwardListResponse = z.infer<typeof AwardListResponseSchema>;
