import { z } from "zod";
import { IdSchema } from "./id";

export const RewardPolicyRefSchema = z.strictObject({
  "policy_id": IdSchema,
  "version": z.string().refine(v => [...v].length >= 1, "String too short").refine(v => [...v].length <= 80, "String too long"),
  "config_hash": z.string().regex(new RegExp("^[0-9a-f]{64}$")),
}).describe("Immutable server-owned policy pinned at report receipt. Null receipt policy is never silently replaced by a later configuration. No numeric default is defined.");
export type RewardPolicyRef = z.infer<typeof RewardPolicyRefSchema>;
