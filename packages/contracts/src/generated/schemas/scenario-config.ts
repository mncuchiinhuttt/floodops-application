import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { CoordinateSchema } from "./coordinate";
import { FeatureFlagsSchema } from "./feature-flags";
import { FixtureAssetSchema } from "./fixture-asset";
import { IncidentFixtureSchema } from "./incident-fixture";
import { ParameterSchema } from "./parameter";
import { PolicySchema } from "./policy";
import { ScenarioSummarySchema } from "./scenario-summary";
import { ScopePairSchema } from "./scope-pair";
import { SourceFixtureSchema } from "./source-fixture";
import { SourcePolicyProfileSchema } from "./source-policy-profile";

export const ScenarioConfigSchema = z.strictObject({
  "scenario": ScenarioSummarySchema,
  "t0": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "timezone": z.string().refine(v => [...v].length <= 80, "String too long"),
  "region_boundary": z.array(CoordinateSchema).refine(v => v.length >= 4, "Too few items"),
  "horizon_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "seed_hash": z.string().refine(v => [...v].length <= 128, "String too long"),
  "config_hash": z.string().refine(v => [...v].length <= 128, "String too long"),
  "graph_hash": z.string().refine(v => [...v].length <= 128, "String too long"),
  "parameters": z.array(ParameterSchema),
  "missing_essential_parameters": z.array(z.string().refine(v => [...v].length <= 100, "String too long")),
  "relevant_scope_pairs": z.array(ScopePairSchema),
  "policies": z.array(PolicySchema),
  "incident_fixtures": z.array(IncidentFixtureSchema),
  "source_fixtures": z.array(SourceFixtureSchema),
  "fixture_assets": z.array(FixtureAssetSchema),
  "source_policy_profiles": z.array(SourcePolicyProfileSchema),
  "feature_flags": FeatureFlagsSchema,
});
export type ScenarioConfig = z.infer<typeof ScenarioConfigSchema>;
