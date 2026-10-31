import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { ErrorCodeSchema } from "./error-code";
import { IdSchema } from "./id";

export const PlanningJobSchema = z.strictObject({
  "job_id": IdSchema,
  "session_id": IdSchema,
  "generation": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "input_revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "status": z.literal(["queued","running","completed","failed","superseded","cancelled"]),
  "plan_id": z.union([IdSchema, z.null()]),
  "error_code": z.union([ErrorCodeSchema, z.null()]),
  "model": z.string().refine(v => [...v].length <= 100, "String too long"),
  "model_config_hash": z.string().refine(v => [...v].length <= 128, "String too long"),
  "created_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "completed_at": z.union([z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"), z.null()]),
});
export type PlanningJob = z.infer<typeof PlanningJobSchema>;
