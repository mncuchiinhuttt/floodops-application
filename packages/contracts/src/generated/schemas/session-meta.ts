import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { CalibrationStatusSchema } from "./calibration-status";
import { IdSchema } from "./id";

export const SessionMetaSchema = z.strictObject({
  "session_id": IdSchema,
  "generation": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "event_sequence": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "scenario_id": IdSchema,
  "scenario_version": z.string().refine(v => [...v].length <= 80, "String too long"),
  "sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "horizon_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "status": z.literal(["active","advancing","resetting","reset","expired"]),
  "calibration_status": CalibrationStatusSchema,
  "created_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "expires_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
});
export type SessionMeta = z.infer<typeof SessionMetaSchema>;
