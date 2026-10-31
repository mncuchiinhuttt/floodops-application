import type { MediaWriteTicket } from "./media-types";
interface Row { [key: string]: string | number; id: string; ticket: string; finished: number; due: number; retry: number }
/** Own additive SQLite table; no credentials, raw bytes or access to platform private tables. */
export class MediaRecoveryStore {
  constructor(private readonly ctx: DurableObjectState, private readonly bucket: R2Bucket | undefined) {
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS sources_media_recovery (id TEXT PRIMARY KEY,ticket TEXT NOT NULL,finished INTEGER NOT NULL,due REAL NOT NULL,retry REAL NOT NULL)");
  }
  ticket(id: string): MediaWriteTicket | null {
    const row = this.ctx.storage.sql.exec<Row>("SELECT * FROM sources_media_recovery WHERE id=?", id).toArray()[0];
    return row ? JSON.parse(row.ticket) as MediaWriteTicket : null;
  }
  async prepare(ticket: MediaWriteTicket): Promise<void> {
    // Resource exclusivity belongs to media-track. Separate generations of one attempt need distinct tombstones.
    if (ticket.recoveryId !== ticket.writerId) throw new Error("Invalid media writer identity");
    if (this.ctx.storage.sql.exec<{ count: number }>("SELECT COUNT(*) AS count FROM sources_media_recovery").one().count >= 1000) throw new Error("Media recovery capacity");
    if (!ticket.key.startsWith(`sessions/${ticket.sessionId}/`) || ticket.key.includes("..")) throw new Error("Invalid media recovery key");
    this.ctx.storage.sql.exec("INSERT INTO sources_media_recovery(id,ticket,finished,due,retry) VALUES(?,?,0,?,15000) ON CONFLICT(id) DO NOTHING", ticket.recoveryId, JSON.stringify(ticket), ticket.writeDeadline);
    await this.schedule();
  }
  async stopped(id: string): Promise<void> {
    const ticket = this.ticket(id); if (!ticket) return;
    this.ctx.storage.sql.exec("UPDATE sources_media_recovery SET finished=2,due=? WHERE id=?", ticket.retainUntil, id);
  }
  async finish(id: string, keep: boolean): Promise<void> {
    const row = this.ctx.storage.sql.exec<Row>("SELECT * FROM sources_media_recovery WHERE id=?", id).toArray()[0];
    if (!row) return;
    // Successful attachment is already in the platform transaction's media_keys ledger.
    // The stopped writer has no future I/O, so its own recovery row can compact immediately.
    if (keep) { this.ctx.storage.sql.exec("DELETE FROM sources_media_recovery WHERE id=?", id); return; }
    this.ctx.storage.sql.exec("UPDATE sources_media_recovery SET finished=1,due=? WHERE id=?", Date.now(), id);
    if (!keep) await this.drain();
    await this.schedule();
  }
  async drain(): Promise<void> {
    if (!this.bucket) return;
    const rows = this.ctx.storage.sql.exec<Row>("SELECT * FROM sources_media_recovery WHERE due<=? ORDER BY due LIMIT 50", Date.now()).toArray();
    for (const row of rows) {
      try {
        const ticket = JSON.parse(row.ticket) as MediaWriteTicket;
        if (!ticket.key.startsWith(`sessions/${ticket.sessionId}/`) || ticket.key.includes("..")) throw new Error("Invalid recovery key");
        await this.bucket.delete(ticket.key);
        if (row.finished) this.ctx.storage.sql.exec("DELETE FROM sources_media_recovery WHERE id=?", row.id);
        else this.ctx.storage.sql.exec("UPDATE sources_media_recovery SET due=?,retry=? WHERE id=?", Date.now() + row.retry, Math.min(row.retry * 2, 3600000), row.id);
      } catch {
        this.ctx.storage.sql.exec("UPDATE sources_media_recovery SET due=? WHERE id=?", Date.now() + 15000, row.id);
      }
    }
  }
  async schedule(): Promise<void> {
    const row = this.ctx.storage.sql.exec<{ due: number | null }>("SELECT MIN(due) AS due FROM sources_media_recovery").one();
    if (row.due === null) return;
    const existing = await this.ctx.storage.getAlarm(), deadline = Math.max(Date.now() + 1, row.due);
    if (existing === null || deadline < existing) await this.ctx.storage.setAlarm(deadline);
  }
}
