import { z } from "zod";
import { IdSchema } from "./id";

export const DriverPositionSchema = z.strictObject({
  "kind": z.literal(["node","on_edge"]),
  "node_id": z.union([IdSchema, z.null()]),
  "segment_id": z.union([IdSchema, z.null()]),
  "entered_sim_minute": z.union([z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."), z.null()]),
  "exit_sim_minute": z.union([z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."), z.null()]),
});
export type DriverPosition = z.infer<typeof DriverPositionSchema>;
