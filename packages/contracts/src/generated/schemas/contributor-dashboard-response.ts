import { z } from "zod";
import { ContributorDashboardSchema } from "./contributor-dashboard";
import { MetaSchema } from "./meta";

export const ContributorDashboardResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ContributorDashboardSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ContributorDashboardResponse = z.infer<typeof ContributorDashboardResponseSchema>;
