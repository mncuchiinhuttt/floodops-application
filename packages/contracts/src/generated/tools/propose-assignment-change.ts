import { z } from "zod";
import { PlanActionSchema } from "../schemas/plan-action";

export const proposeAssignmentChange = {
  name: "propose_assignment_change",
  input: z.strictObject({
  "order_id": z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$")),
  "driver_id": z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$")),
  "pickup_hub_id": z.union([z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$")), z.null()]),
  "route_id": z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$")),
  "reason": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "evidence_ids": z.array(z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$"))).refine(v => v.length >= 1, "Too few items"),
}),
  output: PlanActionSchema,
  sideEffect: "proposal_only",
} as const;
