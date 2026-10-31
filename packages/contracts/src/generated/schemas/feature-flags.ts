import { z } from "zod";

export const FeatureFlagsSchema = z.strictObject({
  "defer_standard": z.boolean(),
  "change_pickup_hub": z.boolean(),
  "reroute_only_baseline": z.boolean(),
});
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;
