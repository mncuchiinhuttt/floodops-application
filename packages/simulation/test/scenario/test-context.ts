import { loadScenario, sealScenarioDraft, createRun } from "@floodops/simulation";
import type { ScenarioManifest, SimulationPolicy } from "@floodops/simulation";
const data = await Bun.file(new URL("../../../../data/scenarios/functional-v1/manifest.json", import.meta.url)).json() as ScenarioManifest;
export const hash = (text: string) => new Bun.CryptoHasher("sha256").update(text).digest("hex");
export const highOnly: SimulationPolicy = { authorizeEntry: ({ knowledge }) => ({
  allowed: knowledge?.state === "known" && knowledge.confidence_band === "high", reason: "POL-02" }) };
export const bikeApproved: SimulationPolicy = { authorizeEntry: ({ driver, knowledge }) => ({
  allowed: knowledge?.state === "known" && (knowledge.confidence_band === "high"
    || (driver.vehicle_type === "motorbike" && knowledge.observation_ids.includes("obs_bike001"))), reason: "POL-02" }) };
export function fixture(): ScenarioManifest { return structuredClone(data); }
export function loaded(change?: (manifest: ScenarioManifest) => void) {
  const manifest = fixture(); change?.(manifest);
  return loadScenario(change ? sealScenarioDraft(manifest, hash) : manifest, hash);
}
export function runFixture(change?: (manifest: ScenarioManifest) => void) { return createRun(loaded(change), "run_functional001"); }
export const motorbikeId = "drv_moto01", carId = "drv_auto01", orderId = "ord_order1";
