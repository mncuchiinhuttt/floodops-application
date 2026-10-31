import { z } from "zod";
import { BranchIdSchema } from "./branch-id";
import { DriverSchema } from "./driver";
import { HubSchema } from "./hub";
import { IdSchema } from "./id";
import { OrderSchema } from "./order";

export const OperationalBranchSchema = z.strictObject({
  "branch_id": BranchIdSchema,
  "drivers": z.array(DriverSchema),
  "hubs": z.array(HubSchema),
  "orders": z.array(OrderSchema),
  "active_route_ids": z.array(IdSchema),
});
export type OperationalBranch = z.infer<typeof OperationalBranchSchema>;
