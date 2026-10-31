import { z } from "zod";

export const ReportReasonSchema = z.literal(["INVALID_SCHEMA","INVALID_IMAGE","UNKNOWN_SEGMENT","LOCATION_MISMATCH","FUTURE_CAPTURE","EXPIRED","DUPLICATE_IMAGE","CONFLICT","ACCEPTED","VALID_BUT_REDUNDANT","UNKNOWN_DATUM","NEEDS_CLARIFICATION"]);
export type ReportReason = z.infer<typeof ReportReasonSchema>;
