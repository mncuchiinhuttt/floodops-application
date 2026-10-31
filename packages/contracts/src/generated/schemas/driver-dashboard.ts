import { z } from "zod";
import { DriverSchema } from "./driver";
import { IdSchema } from "./id";
import { OrderSchema } from "./order";
import { ReportSchema } from "./report";
import { SessionMetaSchema } from "./session-meta";

export const DriverDashboardSchema = z.strictObject({
  "driver_id": IdSchema,
  "session": SessionMetaSchema,
  "driver": DriverSchema,
  "assigned_orders": z.array(OrderSchema),
  "route_ids": z.array(IdSchema),
  "own_reports": z.array(ReportSchema),
});
export type DriverDashboard = z.infer<typeof DriverDashboardSchema>;
