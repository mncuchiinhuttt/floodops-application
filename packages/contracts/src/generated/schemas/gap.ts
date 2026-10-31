import { z } from "zod";
import { IdSchema } from "./id";
import { VehicleTypeSchema } from "./vehicle-type";

export const GapSchema = z.strictObject({
  "gap_id": IdSchema,
  "segment_id": IdSchema,
  "vehicle_type": VehicleTypeSchema,
  "knowledge_epoch": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "opened_sequence": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "status": z.literal(["open","filled"]),
  "filled_by_report_id": z.union([IdSchema, z.null()]),
  "first_award_id": z.union([IdSchema, z.null()]),
});
export type Gap = z.infer<typeof GapSchema>;
