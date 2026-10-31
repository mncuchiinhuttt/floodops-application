import { z } from "zod";
import { AdvanceJobSchema } from "./advance-job";

export const SimulationClockSchema = z.strictObject({
  "now_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "horizon_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "advance_job": z.union([AdvanceJobSchema, z.null()]),
  "mode": z.literal(["paused","advancing"]),
  "playback_controls_are_view_only": z.literal(true),
});
export type SimulationClock = z.infer<typeof SimulationClockSchema>;
