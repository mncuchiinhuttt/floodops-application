import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { IdSchema } from "./id";

export const EventSchema = z.strictObject({
  "event_id": IdSchema,
  "event_sequence": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "session_id": IdSchema,
  "generation": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "type": z.literal(["state_changed","proposal_changed","planning_job_changed","report_changed","award_created","session_reset","session_expired","advance_changed","capability_revoked","image_review_changed"]),
  "actor": z.literal(["system","model","dispatcher","driver","community","external"]),
  "resource_ids": z.array(IdSchema),
  "reason_code": z.union([z.string().refine(v => [...v].length <= 2000, "String too long"), z.null()]),
  "replacement_session_id": z.union([IdSchema, z.null()]),
  "created_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
});
export type Event = z.infer<typeof EventSchema>;
