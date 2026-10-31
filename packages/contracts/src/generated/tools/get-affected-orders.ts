import { z } from "zod";
import { ImpactSchema } from "../schemas/impact";

export const getAffectedOrders = {
  name: "get_affected_orders",
  input: z.strictObject({
  "incident_ids": z.array(z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$"))),
}),
  output: ImpactSchema,
  modelCallable: false, milestone: "M1",
  sideEffect: "read_only",
} as const;
