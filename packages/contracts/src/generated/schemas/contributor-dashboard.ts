import { z } from "zod";
import { AwardSchema } from "./award";
import { CoverageSchema } from "./coverage";
import { IdSchema } from "./id";
import { ReportSchema } from "./report";
import { SessionMetaSchema } from "./session-meta";

export const ContributorDashboardSchema = z.strictObject({
  "contributor_id": IdSchema,
  "session": SessionMetaSchema,
  "own_reports": z.array(ReportSchema),
  "awards": z.array(AwardSchema),
  "points_total": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "coverage": CoverageSchema,
});
export type ContributorDashboard = z.infer<typeof ContributorDashboardSchema>;
