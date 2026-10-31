export function migrate(storage: DurableObjectStorage): void {
  storage.transactionSync(() => {
    const sql = storage.sql;
    sql.exec("CREATE TABLE IF NOT EXISTS schema_meta (version INTEGER NOT NULL)");
    const current = sql.exec<{ version: number }>("SELECT version FROM schema_meta").toArray()[0]?.version ?? 0;
    if (current > 1) throw new Error("Unsupported session schema");
    if (current === 0) {
      sql.exec("CREATE TABLE documents (collection TEXT NOT NULL, id TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY(collection,id))");
      sql.exec("CREATE TABLE events (sequence INTEGER PRIMARY KEY, value TEXT NOT NULL, audience TEXT NOT NULL)");
      sql.exec("CREATE TABLE outcomes (actor TEXT NOT NULL, key TEXT NOT NULL, digest TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY(actor,key))");
      sql.exec("CREATE TABLE counters (category TEXT NOT NULL, bucket TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(category,bucket))");
      sql.exec("INSERT INTO schema_meta(version) VALUES(1)");
    }
  });
}
