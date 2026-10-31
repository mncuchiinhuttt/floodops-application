import { z } from "zod";
import { BranchResultSchema } from "./branch-result";
import { CalibrationStatusSchema } from "./calibration-status";
import { IdSchema } from "./id";

export const ResultsSchema = z.strictObject({
  "session_id": IdSchema,
  "scenario_id": IdSchema,
  "scenario_version": z.string().refine(v => [...v].length <= 80, "String too long"),
  "config_hash": z.string().refine(v => [...v].length <= 128, "String too long"),
  "horizon_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "observed_until_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "calibration_status": CalibrationStatusSchema,
  "branches": z.array(BranchResultSchema).refine(v => v.length >= 2, "Too few items").refine(v => v.length <= 3, "Too many items"),
  "late_reduction_ratio": z.union([z.number().finite(), z.null()]),
  "label": z.literal("Simulation result"),
});
export type Results = z.infer<typeof ResultsSchema>;
