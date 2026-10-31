import { appendEvents } from "./events";
import type { ImageRecord, PlatformBindings, Snapshot } from "../shared/platform-types";
import { Store } from "./store";
export function supersedeImages(store: Store, snapshot: Snapshot, now: number): void {
  for (const record of store.list<ImageRecord>("image_jobs")) {
    if (record.job.status === "superseded" || record.job.status === "failed") continue;
    record.job = { ...record.job, status: "superseded", result: null, error_code: null, completed_at: new Date(now).toISOString() };
    store.put("image_jobs", record.job.job_id, record);
    appendEvents(store, snapshot, [{ type: "image_review_changed", resource_ids: [record.job.report_id, record.job.job_id] }], now);
  }
}
export function expireSession(store: Store, snapshot: Snapshot, now: number): void {
  if (snapshot.meta.status === "expired" || snapshot.meta.status === "reset") return;
  snapshot.meta.status = "expired";
  supersedeImages(store, snapshot, now);
  for (const key of store.list<string>("media_keys")) store.put("cleanup", key, { key });
  appendEvents(store, snapshot, [{ type: "session_expired", audience: ["dispatcher", "driver", "contributor", "viewer"] }], now);
}
export function housekeeping(store: Store, now: number): void {
  const snapshot = store.get<Snapshot>("runtime", "snapshot");
  if (snapshot && (now >= Date.parse(snapshot.meta.expires_at) || now >= snapshot.absoluteExpiry)) expireSession(store, snapshot, now);
  for (const item of store.list<{ id: string; expires: number }>("streams")) if (now >= item.expires) store.remove("streams", item.id);
  store.storage.sql.exec("DELETE FROM counters WHERE category LIKE 'commands:%' AND CAST(bucket AS INTEGER) < ?", Math.floor(now / 60000) - 2);
}
export async function drainCleanup(store: Store, env: PlatformBindings): Promise<void> {
  if (!env.REPORT_MEDIA) return;
  for (const item of store.list<{ key: string }>("cleanup").slice(0, 50)) {
    try {
      await env.REPORT_MEDIA.delete(item.key);
      store.storage.transactionSync(() => { store.remove("cleanup", item.key); store.remove("media_keys", item.key); });
    } catch { /* Keep durable intent for the next alarm; no shared scenario binding is used. */ }
  }
}

export function compactClosedSession(store: Store, now: number): void {
  const snapshot = store.get<Snapshot>("runtime", "snapshot");
  if (!snapshot || !["expired", "reset"].includes(snapshot.meta.status) || store.list("cleanup").length) return;
  snapshot.values = snapshot.meta.status === "reset" ? { replacement_session_id: snapshot.values.replacement_session_id } : {};
  snapshot.seed.values = {}; snapshot.leases = {}; snapshot.pointers = {};
  store.save(snapshot);
  store.storage.sql.exec("DELETE FROM events");
  store.storage.sql.exec("DELETE FROM documents WHERE collection IN ('image_jobs','image_current','invitations','streams','media_keys')");
  if (now >= snapshot.absoluteExpiry) {
    store.storage.sql.exec("DELETE FROM outcomes");
    store.storage.sql.exec("DELETE FROM documents WHERE collection IN ('participants','reset')");
  }
}
