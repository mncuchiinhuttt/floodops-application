import { z } from "zod";
import { IdSchema } from "./id";

export const StopReferenceSchema = z.strictObject({
  "order_id": IdSchema,
  "kind": z.literal(["pickup","delivery"]),
});
export type StopReference = z.infer<typeof StopReferenceSchema>;
