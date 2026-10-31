import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";

export const TimestampSchema = z.string().refine(isTimestamp, "Invalid RFC3339 timestamp");
export type Timestamp = z.infer<typeof TimestampSchema>;
