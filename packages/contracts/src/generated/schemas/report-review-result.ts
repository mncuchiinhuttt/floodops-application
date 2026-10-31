import { z } from "zod";
import { hasUniqueItems } from "../../schema-helpers";
import { AwardSchema } from "./award";
import { IdSchema } from "./id";
import { ObservationSchema } from "./observation";
import { ReportSchema } from "./report";

export const ReportReviewResultSchema = z.strictObject({
  "report": ReportSchema,
  "observations": z.array(ObservationSchema),
  "filled_gap_ids": z.array(IdSchema).refine(hasUniqueItems, "Duplicate items"),
  "award": z.union([AwardSchema, z.null()]),
  "planning_job_id": z.union([IdSchema, z.null()]),
}).refine(v => z.unknown().refine(v => !z.object({"report": z.object({"reward": z.object({"status": z.literal("committed").optional()}).optional()}).optional()}).safeParse(v).success || z.object({"award": AwardSchema.optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"report": z.object({"reward": z.object({"status": z.literal(["pending_review","pending_config","ineligible"]).optional()}).optional()}).optional()}).safeParse(v).success || z.object({"award": z.null().optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.object({"report": z.object({"status": z.literal(["accepted","rejected"]).optional()}).optional()}).safeParse(v).success, "Conditional constraint").describe("Successful manual review may update observations/knowledge with reward pending_config and award=null. It must not be blocked for absent reward config or AI advice. Full reward identity equality is additionally checked by parseM1ReviewResult.");
export type ReportReviewResult = z.infer<typeof ReportReviewResultSchema>;
