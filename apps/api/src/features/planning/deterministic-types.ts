import type { Plan, Route, InternalServiceInput } from "@floodops/contracts";
export const PLANNER_VERSION = "deterministic-bounded-v1";
export interface SearchLimits { maxCandidates: number; maxDrivers: number; maxOrders: number; maxStops: number }
export const DEFAULT_SEARCH_LIMITS: Readonly<SearchLimits> = Object.freeze({
  maxCandidates: 16, maxDrivers: 8, maxOrders: 16, maxStops: 12
});
export interface CandidateSpec {
  routes: InternalServiceInput<"compute_route">[];
  assignment: { order_id: string; driver_id: string } | null;
  allowPending: boolean;
  key: string;
}
export interface SearchEvidence {
  algorithm: typeof PLANNER_VERSION;
  outcome: "candidate" | "no_feasible_plan" | "no_change";
  evaluated: number; limits: SearchLimits; truncated: boolean;
  selected_key: string | null;
}
export interface DeterministicProposal { plan: Plan; routes: Route[]; search: SearchEvidence }
export class PlanningSearchStopped extends Error {
  constructor(readonly reason: "cancelled" | "deadline") { super(reason); }
}
export function searchLimits(input: Partial<SearchLimits> = {}): SearchLimits {
  const limits = { ...DEFAULT_SEARCH_LIMITS, ...input };
  const caps: SearchLimits = { maxCandidates: 128, maxDrivers: 16, maxOrders: 32, maxStops: 24 };
  for (const key of Object.keys(caps) as (keyof SearchLimits)[])
    if (!Number.isSafeInteger(limits[key]) || limits[key] < 1 || limits[key] > caps[key]) throw new Error("Invalid planner search bounds.");
  return limits;
}
