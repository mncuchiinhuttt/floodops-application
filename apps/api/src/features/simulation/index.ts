import { createSimulationRouter } from "./router";
import { startAdvance } from "./start-advance";
import { continueAdvance } from "./continue-advance";
import { simulationViews } from "./views";
import { expireAdvance } from "./state";
import { ADVANCE_CHUNK, ADVANCE_START } from "./runtime-types";
import type { ResolvedOptions, SimulationRuntimeOptions } from "./runtime-types";
import type { RuntimeRegistry } from "../../shared/index";

function material() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return { jobId: `advance_${crypto.randomUUID()}`, leaseId: `lease_${crypto.randomUUID()}`,
    nonce: Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("") };
}
export function createSimulationRuntime<State>(options: SimulationRuntimeOptions<State>) {
  const resolved: ResolvedOptions<State> = { ...options, material: options.material ?? material,
    leaseDurationMs: options.leaseDurationMs ?? 15000, maxBoundaries: options.maxBoundaries ?? 64, maxChunks: options.maxChunks ?? 32 };
  for (const [value, max] of [[resolved.leaseDurationMs, 60000], [resolved.maxBoundaries, 256], [resolved.maxChunks, 128]]) {
    if (!Number.isSafeInteger(value) || value! < 1 || value! > max!) throw new Error("Invalid advance runtime budget.");
  }
  const registry: RuntimeRegistry = { commands: { [ADVANCE_START]: startAdvance(resolved), [ADVANCE_CHUNK]: continueAdvance(resolved) },
    views: simulationViews(resolved), onLeaseExpired: (snapshot, lease) => expireAdvance(snapshot, lease) };
  return { registry, router: createSimulationRouter(resolved.maxChunks) };
}
export type { RuntimeDispatch } from "./advance-service";
export { driveAdvance } from "./advance-service";
export { ADVANCE_START, ADVANCE_CHUNK, CLOCK_VIEW, JOBS_VIEW } from "./runtime-types";
export type { SimulationRuntimeOptions, AdvanceMaterial, AdvanceReservation, ChunkInput } from "./runtime-types";
