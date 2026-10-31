import { parseSchema } from "@floodops/contracts";
import { fail } from "../shared/platform-error";
import type { Call, RuntimeRegistry, Snapshot, Transition } from "../shared/platform-types";
import { appendEvents } from "./events";
import { Store } from "./store";
import { matchesSerialization } from "./serialization";
export function assertFence(snapshot: Snapshot, call: Call, now: number, nonceDigest?: string): void {
  for (const [name, value] of Object.entries(call.expectedPointers ?? {})) if ((snapshot.pointers[name] ?? null) !== value) fail(409, "STALE_PROPOSAL", snapshot);
  if (!call.fence) return;
  const lease = snapshot.leases[call.fence.lease_id];
  if (!lease || lease.status !== "active" || lease.nonce_digest !== nonceDigest || lease.generation !== snapshot.meta.generation || now >= lease.expires_at) fail(409, "STATE_CONFLICT", snapshot);
  if (lease.bind_revision && lease.revision !== snapshot.meta.revision) fail(412, "REVISION_MISMATCH", snapshot);
  if (lease.kind === "planning" && snapshot.pointers.latest_requested_job_id !== lease.job_id) fail(409, "STALE_PROPOSAL", snapshot);
  if (lease.kind === "advance" && snapshot.pointers.active_advance_job_id !== lease.job_id) fail(409, "STATE_CONFLICT", snapshot);
}
export function updateLeases(snapshot: Snapshot, transition: Transition, registry: RuntimeRegistry): void {
  if (transition.pointers) {
    if (transition.pointers.latest_requested_job_id !== undefined && transition.pointers.latest_requested_job_id !== snapshot.pointers.latest_requested_job_id) snapshot.pointers.latest_plan_id = null;
    for (const [key, value] of Object.entries(transition.pointers)) {
      if (!["latest_requested_job_id", "latest_plan_id", "active_advance_job_id"].includes(key)) fail(503, "CONFIG_INCOMPLETE");
      if (value !== null) parseSchema("Id", value);
      snapshot.pointers[key] = value;
    }
  }
  for (const lease of transition.leases ?? []) {
    if (!registry.onLeaseExpired || !/^[a-f0-9]{64}$/.test(lease.nonce_digest) || !Number.isFinite(lease.expires_at)) fail(503, "CONFIG_INCOMPLETE");
    parseSchema("Id", lease.lease_id); parseSchema("Id", lease.job_id);
    if (lease.generation !== snapshot.meta.generation) fail(409, "STATE_CONFLICT", snapshot);
    snapshot.leases[lease.lease_id] = structuredClone(lease);
  }
}
export function reconcileLeases(store: Store, registry: RuntimeRegistry, now: number): void {
  const snapshot = store.get<Snapshot>("runtime", "snapshot");
  if (!snapshot?.leases || !matchesSerialization(snapshot.seed, registry)) return;
  for (const lease of Object.values(snapshot.leases)) {
    if (lease.status !== "active") continue;
    const stale = ["resetting", "reset", "expired"].includes(snapshot.meta.status) || lease.generation !== snapshot.meta.generation ||
      (lease.bind_revision && lease.revision !== snapshot.meta.revision) || (lease.kind === "planning" && snapshot.pointers.latest_requested_job_id !== lease.job_id) || (lease.kind === "advance" && snapshot.pointers.active_advance_job_id !== lease.job_id);
    if (!stale && now < lease.expires_at) continue;
    lease.status = stale ? "superseded" : "failed";
    lease.error_code = stale ? null : lease.kind === "planning" ? "PLANNER_TIMEOUT" : "STORAGE_UNAVAILABLE";
    if (registry.onLeaseExpired) snapshot.values = registry.onLeaseExpired(structuredClone(snapshot), structuredClone(lease), now);
    if (lease.kind === "advance" && snapshot.meta.status === "advancing" && snapshot.pointers.active_advance_job_id === lease.job_id) { snapshot.meta.status = "active"; snapshot.pointers.active_advance_job_id = null; }
    appendEvents(store, snapshot, [{ type: lease.kind === "advance" ? "advance_changed" : "planning_job_changed", resource_ids: [lease.job_id], reason_code: lease.error_code }], now);
  }
}
