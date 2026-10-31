import { fail } from "../shared/platform-error";
import type { Reply, Snapshot } from "../shared/platform-types";
export class Store {
  constructor(readonly storage: DurableObjectStorage) {}
  get<T>(collection: string, id: string): T | undefined {
    const row = this.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection=? AND id=?", collection, id).toArray()[0];
    return row ? JSON.parse(row.value) as T : undefined;
  }
  put(collection: string, id: string, value: unknown): void {
    this.storage.sql.exec("INSERT INTO documents(collection,id,value) VALUES(?,?,?) ON CONFLICT(collection,id) DO UPDATE SET value=excluded.value", collection, id, JSON.stringify(value));
  }
  remove(collection: string, id: string): void { this.storage.sql.exec("DELETE FROM documents WHERE collection=? AND id=?", collection, id); }
  list<T>(collection: string): T[] {
    return this.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection=? ORDER BY id", collection).toArray().map(r => JSON.parse(r.value) as T);
  }
  snapshot(): Snapshot { const value = this.get<Snapshot>("runtime", "snapshot"); if (!value) fail(404, "NOT_FOUND"); value.pointers ??= { latest_requested_job_id: null, latest_plan_id: null }; value.leases ??= {}; return value; }
  save(snapshot: Snapshot): void { this.put("runtime", "snapshot", snapshot); }
  replay(actor: string, key: string, digest: string): Reply | undefined {
    const row = this.storage.sql.exec<{ digest: string; value: string }>("SELECT digest,value FROM outcomes WHERE actor=? AND key=?", actor, key).toArray()[0];
    if (!row) return undefined;
    if (row.digest !== digest) fail(409, "IDEMPOTENCY_KEY_REUSED");
    return JSON.parse(row.value) as Reply;
  }
  remember(actor: string, key: string, digest: string, reply: Reply): void {
    const stored = { ...reply }; delete stored.effect;
    this.storage.sql.exec("INSERT INTO outcomes(actor,key,digest,value) VALUES(?,?,?,?)", actor, key, digest, JSON.stringify(stored));
  }
  consume(category: string, bucket: string, maximum: number): boolean {
    this.storage.sql.exec("INSERT INTO counters(category,bucket,count) VALUES(?,?,0) ON CONFLICT DO NOTHING", category, bucket);
    return this.storage.sql.exec("UPDATE counters SET count=count+1 WHERE category=? AND bucket=? AND count<? RETURNING count", category, bucket, maximum).toArray().length === 1;
  }
}
