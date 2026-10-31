import { z } from "zod";
import { exactlyOne } from "../../schema-helpers";
import { CitizenReportInputSchema } from "./citizen-report-input";
import { DriverReportInputSchema } from "./driver-report-input";

export const SubmitReportInputSchema = exactlyOne([DriverReportInputSchema, CitizenReportInputSchema]);
export type SubmitReportInput = z.infer<typeof SubmitReportInputSchema>;
