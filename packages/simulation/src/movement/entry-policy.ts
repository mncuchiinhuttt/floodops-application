import type { Driver } from "@floodops/contracts";
import type { BranchId, EntryDecision, SimulationPolicy, SimulationRun } from "./run-types.ts";
import { millisecondsToMinutes } from "../clock/index.ts";

export function checkEntry(run: SimulationRun, branch: BranchId, driver: Driver,
  segmentId: string, atMs: number, policy: SimulationPolicy): EntryDecision {
  const source = run.knowledge.find(item => item.segment_id === segmentId && item.vehicle_type === driver.vehicle_type) ?? null;
  const atMinute = millisecondsToMinutes(atMs);
  const expired = source?.state !== "authoritative_closed" && source?.expires_sim_minute !== null
    && source?.expires_sim_minute !== undefined && atMinute >= source.expires_sim_minute;
  const knowledge = expired && source ? { ...source, state: "ordinary_unknown" as const,
    condition: "unknown" as const, confidence_band: null, observation_ids: [], expires_sim_minute: null } : source;
  if (knowledge?.state === "authoritative_closed" || knowledge?.condition === "impassable") return { allowed: false, reason: "POL-01" };
  if (knowledge?.state === "unresolved_conflict") return { allowed: false, reason: "POL-03:CONFLICT" };
  return policy.authorizeEntry({ branch, driver: structuredClone(driver), segmentId, atMinute,
    knowledge: knowledge ? structuredClone(knowledge) : null });
}
