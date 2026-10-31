import { expect, test } from "bun:test";
import { FixtureAssetSchema, SubmitReportInputSchema } from "@floodops/contracts";
import { createReportCases, syntheticReportAsset } from "@floodops/test-fixtures";

test("synthetic report inputs are canonical and actual PNG bytes match frozen metadata", async () => {
  for (const report of Object.values(createReportCases())) expect(SubmitReportInputSchema.safeParse(report).success).toBe(true);
  expect(FixtureAssetSchema.safeParse(syntheticReportAsset).success).toBe(true);
  const bytes = new Uint8Array(await Bun.file(new URL("../../../data/scenarios/functional-v1/synthetic-report.png", import.meta.url)).arrayBuffer());
  expect([...bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.length).toBe(syntheticReportAsset.byte_length);
  const view = new DataView(bytes.buffer); expect(view.getUint32(16)).toBe(64); expect(view.getUint32(20)).toBe(48);
  expect(new Bun.CryptoHasher("sha256").update(bytes).digest("hex")).toBe(syntheticReportAsset.sha256);
  const cases = createReportCases(); expect(cases.duplicate.fixture_photo_id).toBe(cases.fresh.fixture_photo_id);
  expect(cases.expired.captured_sim_minute).toBeLessThan(cases.fresh.captured_sim_minute);
});
