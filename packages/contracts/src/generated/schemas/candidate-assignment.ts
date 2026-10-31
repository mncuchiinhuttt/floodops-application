import { z } from "zod";
import { IdSchema } from "./id";

export const CandidateAssignmentSchema = z.strictObject({
  "order_id": IdSchema,
  "driver_id": IdSchema,
  "pickup_hub_id": z.union([IdSchema, z.null()]),
});
export type CandidateAssignment = z.infer<typeof CandidateAssignmentSchema>;
