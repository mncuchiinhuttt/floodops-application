import { z } from "zod";
import { MetaSchema } from "./meta";
import { ReportSchema } from "./report";

export const ReportResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ReportSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ReportResponse = z.infer<typeof ReportResponseSchema>;
