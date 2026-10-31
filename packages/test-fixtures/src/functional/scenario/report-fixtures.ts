import type { CitizenReportInput, DriverReportInput, FixtureAsset } from "@floodops/contracts";
import { syntheticProvenance } from "./graph-fixture.ts";

/** Procedural geometric PNG, no real photograph or vision-quality/evidence claim. */
export const syntheticReportAsset: FixtureAsset = Object.freeze({
  asset_id: "asset_synthetic01", fixture_photo_id: "photo_fixture01", content_type: "image/png",
  sha256: "1ae5d1b406a5aea5bd6c91a126710100063ad0a96883866c6ced960c3fd027a6", byte_length: 187, width: 64, height: 48,
  provenance: Object.freeze({ ...syntheticProvenance, source_hash: "1ae5d1b406a5aea5bd6c91a126710100063ad0a96883866c6ced960c3fd027a6", method: "Original procedural geometric PNG; synthetic media pipeline fixture, not a real road image." })
});
export function createReportCases() {
  const fresh: CitizenReportInput = { kind: "citizen", media_id: null, fixture_photo_id: "photo_fixture01", segment_id: "seg_edge27",
    coordinate: [106.701, 10.7705], captured_at: "2026-10-31T00:03:00Z", captured_sim_minute: 3, vehicle_types: ["motorbike"],
    description: "Simulated report for manual review; image is a labelled synthetic geometric fixture." };
  const conflictingDriver: DriverReportInput = { kind: "driver", input_mode: "quick", quick_condition: "impassable", segment_id: "seg_edge27",
    coordinate: [106.701, 10.7705], captured_at: fresh.captured_at, captured_sim_minute: 3, vehicle_types: ["motorbike"], description: "Simulated contradictory driver observation." };
  return { fresh, duplicate: structuredClone(fresh), expired: { ...structuredClone(fresh), captured_at: "2026-10-31T00:00:00Z", captured_sim_minute: 0 },
    conflictingDriver, contraryClosure: { ...structuredClone(fresh), segment_id: "seg_edge17", coordinate: [106.7005, 10.77] as [number, number], description: "Simulated contrary report; cannot remove authoritative closure." } };
}
