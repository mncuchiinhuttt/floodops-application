import { z } from "zod";
import { PageSchema } from "./page";
import { ReportSchema } from "./report";

export const ReportListSchema = z.strictObject({
  "items": z.array(ReportSchema).refine(v => v.length <= 100, "Too many items"),
  "page": PageSchema,
});
export type ReportList = z.infer<typeof ReportListSchema>;
