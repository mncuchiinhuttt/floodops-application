import { expect, test } from "bun:test";
import { SourceSchema, SourcePolicyProfileSchema, ScenarioConfigSchema } from "@floodops/contracts";
import { proposeReportSubmission } from "@floodops/domain/reporting";
import { loadScenario } from "@floodops/simulation";
import type { ScenarioManifest } from "@floodops/simulation";
import { fixture, hash } from "./test-context.ts";
import { canonicalDriverPipeline } from "./driver-source-v2-context.ts";

test("frozen v2 adds only explicit low non-authority driver configuration and preserves v1 physics", async () => {
  const v1 = fixture(), manifest = await Bun.file(new URL("../../../../data/scenarios/functional-v2/manifest.json", import.meta.url)).json() as ScenarioManifest;
  const loaded = loadScenario(manifest, hash), v2 = loaded.manifest;
  expect(ScenarioConfigSchema.safeParse(v2.config).success).toBe(true);
  expect(v2.config.scenario).toEqual({ ...v1.config.scenario, version: "2" });
  expect(v2.graph).toEqual(v1.graph); expect(v2.initial).toEqual(v1.initial); expect(v2.initialRoutes).toEqual(v1.initialRoutes);
  expect(v2.events).toEqual(v1.events); expect(v2.hubWindows).toEqual(v1.hubWindows); expect(v2.seed).toBe(v1.seed);
  expect(v2.config.parameters.slice(0, v1.config.parameters.length)).toEqual(v1.config.parameters);
  expect(v2.config.parameters).toHaveLength(v1.config.parameters.length + 2);
  expect(v1.sourceSnapshot.sources.filter(source => source.source_type === "driver")).toHaveLength(0);
  const drivers = v2.sourceSnapshot.sources.filter(source => source.source_type === "driver" && source.role === "observation");
  expect(drivers).toHaveLength(1); expect(SourceSchema.safeParse(drivers[0]).success).toBe(true);
  expect(drivers[0]).toMatchObject({ source_id: "src_driver01", access_status: "available", is_simulated: true, policy_profile_id: "prf_driver01" });
  const profile = v2.config.source_policy_profiles.find(profile => profile.policy_profile_id === drivers[0]!.policy_profile_id)!;
  expect(SourcePolicyProfileSchema.safeParse(profile).success).toBe(true);
  expect(profile).toMatchObject({ confidence_band: "low", ttl_sim_minute: 3, location_tolerance_m: 10, is_restriction_authority: false, may_reopen_restriction: false });
  for (const key of profile.parameter_keys) {
    const value = v2.config.parameters.find(parameter => parameter.key === key)!;
    expect(value.basis).toBe("assumed"); expect(value.provenance[0]!.label).toBe("simulated");
  }
  const bytes = await Bun.file(new URL("../../../../data/scenarios/functional-v1/manifest.json", import.meta.url)).arrayBuffer();
  expect(new Bun.CryptoHasher("sha256").update(bytes).digest("hex")).toBe("3c14fcd1b67057028997e4d6ca8de6b9bafeaba710adee6b0448ec40e42cb66f");
  expect(v2.config.config_hash).not.toBe(v1.config.config_hash); expect(v2.config.seed_hash).not.toBe(v1.config.seed_hash);
  expect(v2.config.graph_hash).toBe(v1.config.graph_hash); expect(v2.config.scenario.calibration_status).toBe("incomplete");
});

test("canonical driver quick report produces own-vehicle fresh low evidence through the real public source pipeline", async () => {
  const { run, next, submitted, accepted, context, input } = await canonicalDriverPipeline();
  expect(submitted.report.status).toBe("pending_review"); expect(accepted.report.status).toBe("accepted");
  expect(accepted.committed).toBe(false); expect(accepted.report.award_id).toBeNull();
  expect(accepted.observations.find(observation => observation.observation_id === context.observationId)).toMatchObject({
    source_id: "src_driver01", vehicle_types: ["motorbike"], confidence_band: "low", validation: "accepted", observed_sim_minute: 3, expires_sim_minute: 6 });
  for (const vehicle of ["car", "truck"]) expect(next.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === vehicle))
    .toEqual(run.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === vehicle));
  for (const [id, branch] of Object.entries(run.branches)) expect(next.branches[id as keyof typeof next.branches]!.operations).toEqual(branch.operations);
  expect(next.scenario).toEqual(run.scenario); expect(next.nowMs).toBe(run.nowMs);
  expect(() => proposeReportSubmission({ ...input, vehicle_types: ["car"] }, context)).toThrow("FORBIDDEN");
  expect(() => proposeReportSubmission({ ...input, reporter_entity_id: "drv_someone1" }, context)).toThrow("FORBIDDEN");
});
