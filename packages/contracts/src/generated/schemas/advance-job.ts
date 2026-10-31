import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { ErrorCodeSchema } from "./error-code";
import { IdSchema } from "./id";

export const AdvanceJobSchema = z.strictObject({
  "advance_job_id": IdSchema,
  "target_sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "reached_sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "status": z.literal(["queued","running","completed","failed"]),
  "revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "lease_expires_at": z.union([z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"), z.null()]),
  "error_code": z.union([ErrorCodeSchema, z.null()]),
});
export type AdvanceJob = z.infer<typeof AdvanceJobSchema>;
