import { CONTRACT_VERSION, parseSchema } from "@floodops/contracts";
import { fail } from "../../shared/index";
import type { Snapshot } from "../../shared/index";
import type { PlanningState } from "./runtime-types";
import { PLANNING_KEY } from "./runtime-types";
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export function isM1PlanningSnapshot(snapshot: Snapshot): boolean {
  const version = snapshot.values.runtime_contract;
  return record(version) && version.serialization === "m1-v1" && version.version === CONTRACT_VERSION;
}
export function readPlanningState(snapshot: Snapshot): PlanningState {
  if (!isM1PlanningSnapshot(snapshot)) fail(409, "STATE_CONFLICT", snapshot);
  const raw = snapshot.values[PLANNING_KEY];
  if (raw === undefined) return { version: 1, session_id: snapshot.meta.session_id, generation: snapshot.meta.generation,
    jobs: {}, plans: {}, routes: {}, approvals: [], approvalHistory: [], executions: {}, notifications: {}, incidents: [], committedRoutes: {}, grants: [] };
  if (!record(raw) || raw.version !== 1 || raw.session_id !== snapshot.meta.session_id || raw.generation !== snapshot.meta.generation
    || !["jobs", "plans", "routes", "executions", "notifications", "committedRoutes"].every(key => record(raw[key]))
    || !["approvals", "approvalHistory", "incidents", "grants"].every(key => Array.isArray(raw[key]))) fail(503, "CONFIG_INCOMPLETE");
  const state = structuredClone(raw) as unknown as PlanningState;
  for (const [id, r] of Object.entries(state.jobs)) {
    if (!r || parseSchema("PlanningJob", r.job).job_id !== id || !record(r.capturedValues)) fail(503, "CONFIG_INCOMPLETE");
    parseSchema("Id", r.leaseId); parseSchema("PlanningJobInput", r.input);
  }
  for (const [id, p] of Object.entries(state.plans)) if (parseSchema("Plan", p).plan_id !== id
    || p.session_id !== snapshot.meta.session_id || p.generation !== snapshot.meta.generation) fail(503, "CONFIG_INCOMPLETE");
  for (const [id, r] of Object.entries(state.routes)) if (parseSchema("Route", r).route_id !== id) fail(503, "CONFIG_INCOMPLETE");
  for (const [id, e] of Object.entries(state.executions)) if (parseSchema("Execution", e).execution_id !== id) fail(503, "CONFIG_INCOMPLETE");
  for (const [id, n] of Object.entries(state.notifications)) if (parseSchema("Notification", n).notification_id !== id) fail(503, "CONFIG_INCOMPLETE");
  state.approvals.forEach(a => parseSchema("Approval", a)); state.approvalHistory.forEach(a => parseSchema("Approval", a)); state.incidents.forEach(i => parseSchema("Incident", i));
  for (const [key, id] of Object.entries(state.committedRoutes)) {
    if (!/^(static|floodops|reroute_only):/.test(key) || !state.routes[id]) fail(503, "CONFIG_INCOMPLETE");
  }
  for (const g of state.grants) {
    ["execution_id", "plan_id", "driver_id", "route_id", "segment_id"].forEach(key => parseSchema("Id", g[key as keyof typeof g]));
    parseSchema("BranchId", g.branch); parseSchema("VehicleType", g.vehicle_type);
    if (!Array.isArray(g.action_ids) || !g.action_ids.length || !Array.isArray(g.evidence_ids)
      || !Number.isSafeInteger(g.knowledge_epoch) || g.knowledge_epoch < 0 || !Number.isFinite(g.expires_sim_minute)
      || g.expires_sim_minute < 0 || !["ordinary_unknown", "low"].includes(g.basis)) fail(503, "CONFIG_INCOMPLETE");
    g.action_ids.forEach(id => parseSchema("Id", id)); g.evidence_ids.forEach(id => parseSchema("Id", id));
  }
  return state;
}
export function planningValues(snapshot: Snapshot, state: PlanningState): Record<string, unknown> {
  return { ...snapshot.values, [PLANNING_KEY]: state };
}
