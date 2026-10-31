import { z } from "zod";
import { DriverDashboardSchema } from "./driver-dashboard";
import { MetaSchema } from "./meta";

export const DriverDashboardResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": DriverDashboardSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type DriverDashboardResponse = z.infer<typeof DriverDashboardResponseSchema>;
