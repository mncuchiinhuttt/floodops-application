import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { IdSchema } from "./id";

export const ApprovalSchema = z.strictObject({
  "approval_id": IdSchema,
  "plan_id": IdSchema,
  "action_id": IdSchema,
  "input_revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "decision": z.literal(["approve","reject"]),
  "participant_id": IdSchema,
  "reason": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "created_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
});
export type Approval = z.infer<typeof ApprovalSchema>;
