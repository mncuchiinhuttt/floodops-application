import type { Source, SourcePolicyProfile } from "@floodops/contracts";
import { createFunctionalScenario } from "./functional-scenario.ts";
import { parameter, syntheticProvenance } from "./graph-fixture.ts";

/** Opt-in version2 draft; version1 factory and frozen bytes remain unchanged. */
export function createFunctionalScenarioV2() {
  const manifest = createFunctionalScenario();
  const profile: SourcePolicyProfile = { policy_profile_id: "prf_driver01", confidence_band: "low",
    ttl_sim_minute: 3, location_tolerance_m: 10, is_restriction_authority: false, may_reopen_restriction: false,
    parameter_keys: ["ttl_driver", "location_driver"] };
  const driver: Source = { source_id: "src_driver01", provider: "Synthetic driver quick-report fixture", source_type: "driver",
    role: "observation", access_status: "available", is_simulated: true, policy_profile_id: profile.policy_profile_id,
    provenance: { ...syntheticProvenance, source_hash: "synthetic-driver-source-v2",
      method: "Functional MVP assumption: low confidence,3sim-minute TTL,10m mapping tolerance; no real calibration or authority." } };
  manifest.config.scenario.version = "2";
  manifest.config.parameters.push(parameter("ttl_driver", 3, "minute"), parameter("location_driver", 10, "m"));
  manifest.config.source_policy_profiles.push(profile);
  manifest.sourceSnapshot.sources.push(driver);
  return manifest;
}
