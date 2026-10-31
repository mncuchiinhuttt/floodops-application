import { z } from "zod";
import { PlanActionSchema } from "../schemas/plan-action";

export const proposeOrderDeferral = {
  name: "propose_order_deferral",
  input: z.strictObject({
  "order_id": z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$")),
  "defer_minute": z.number().finite().gt(0),
  "reason": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "evidence_ids": z.array(z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$"))).refine(v => v.length >= 1, "Too few items"),
}),
  output: PlanActionSchema,
  sideEffect: "proposal_only",
} as const;
