import { z } from "zod";

export const FeatureFlagsSchema = z.strictObject({
  "defer_standard": z.boolean().describe("M2-only feature; M1 sessions publish false. Runtime must enforce the milestone gate."),
  "change_pickup_hub": z.boolean().describe("M2-only feature; M1 sessions publish false. Runtime must enforce the milestone gate."),
  "reroute_only_baseline": z.boolean().describe("M2-only feature; M1 sessions publish false. Runtime must enforce the milestone gate."),
});
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;
