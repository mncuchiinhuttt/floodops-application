import { z } from "zod";
import { ConfidenceSchema } from "./confidence";
import { IdSchema } from "./id";

export const SourcePolicyProfileSchema = z.strictObject({
  "policy_profile_id": IdSchema,
  "confidence_band": ConfidenceSchema,
  "ttl_sim_minute": z.union([z.number().finite().gt(0), z.null()]),
  "location_tolerance_m": z.union([z.number().finite().min(0), z.null()]),
  "is_restriction_authority": z.boolean(),
  "may_reopen_restriction": z.boolean(),
  "parameter_keys": z.array(z.string().refine(v => [...v].length <= 100, "String too long")),
});
export type SourcePolicyProfile = z.infer<typeof SourcePolicyProfileSchema>;
