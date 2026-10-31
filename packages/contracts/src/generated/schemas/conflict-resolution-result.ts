import { z } from "zod";
import { AwardSchema } from "./award";
import { ConflictSchema } from "./conflict";
import { IdSchema } from "./id";
import { ObservationSchema } from "./observation";

export const ConflictResolutionResultSchema = z.strictObject({
  "conflict": ConflictSchema,
  "observations": z.array(ObservationSchema),
  "filled_gap_ids": z.array(IdSchema),
  "awards": z.array(AwardSchema),
  "planning_job_id": z.union([IdSchema, z.null()]),
});
export type ConflictResolutionResult = z.infer<typeof ConflictResolutionResultSchema>;
