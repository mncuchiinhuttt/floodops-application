import { z } from "zod";

export const CalibrationStatusSchema = z.literal(["incomplete","validated","failed"]);
export type CalibrationStatus = z.infer<typeof CalibrationStatusSchema>;
