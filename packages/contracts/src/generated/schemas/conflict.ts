import { z } from "zod";
import { IdSchema } from "./id";
import { VehicleTypeSchema } from "./vehicle-type";

export const ConflictSchema = z.strictObject({
  "conflict_id": IdSchema,
  "segment_id": IdSchema,
  "vehicle_type": VehicleTypeSchema,
  "knowledge_epoch": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "observation_ids": z.array(IdSchema).refine(v => v.length >= 2, "Too few items"),
  "status": z.literal(["unresolved","resolved"]),
  "resolution_reason": z.union([z.string().refine(v => [...v].length <= 2000, "String too long"), z.null()]),
});
export type Conflict = z.infer<typeof ConflictSchema>;
