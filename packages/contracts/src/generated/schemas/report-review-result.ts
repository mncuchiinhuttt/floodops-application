import { z } from "zod";
import { AwardSchema } from "./award";
import { IdSchema } from "./id";
import { ObservationSchema } from "./observation";
import { ReportSchema } from "./report";

export const ReportReviewResultSchema = z.strictObject({
  "report": ReportSchema,
  "observations": z.array(ObservationSchema),
  "filled_gap_ids": z.array(IdSchema),
  "award": z.union([AwardSchema, z.null()]),
  "planning_job_id": z.union([IdSchema, z.null()]),
});
export type ReportReviewResult = z.infer<typeof ReportReviewResultSchema>;
