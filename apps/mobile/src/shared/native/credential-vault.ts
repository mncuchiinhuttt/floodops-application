import { SessionCreatedSchema, type SessionCreated } from "@floodops/contracts";
export interface SecurePort { available(): Promise<boolean>; read(key: string): Promise<string | null>; write(key: string, value: string): Promise<void>; remove(key: string): Promise<void> }
const key = "floodops.native.active.v1";
export class CredentialUnavailable extends Error { constructor() { super("Native secure credentials unavailable. Rejoin explicitly."); } }
/** A single atomic secure envelope; no plaintext or memory-token fallback. */
export class CredentialVault {
  private failed = false;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly port: SecurePort, private readonly now: () => number) {}
  private secure<T>(action: () => Promise<T>, recover = false): Promise<T> {
    const pending = this.queue.then(async () => {
      try { if ((this.failed && !recover) || !await this.port.available()) throw new CredentialUnavailable(); const value = await action(); if (recover) this.failed = false; return value; }
      catch { this.failed = true; throw new CredentialUnavailable(); }
    });
    this.queue = pending.catch(() => undefined); return pending;
  }
  async adopt(value: SessionCreated, current: () => boolean = () => true): Promise<void> {
    await this.secure(async () => {
      if (!current()) throw new CredentialUnavailable();
      const parsed = SessionCreatedSchema.parse(value);
      if (parsed.credential.client_type !== "native" || !parsed.credential.access_token || parsed.credential.csrf_token !== null ||
        Date.parse(parsed.credential.expires_at) <= this.now()) throw new CredentialUnavailable();
      await this.port.write(key, JSON.stringify(parsed));
      if (!current()) { await this.port.remove(key); throw new CredentialUnavailable(); }
    }, true);
  }
  async load(): Promise<SessionCreated | null> {
    return this.secure(async () => {
      const raw = await this.port.read(key); if (raw === null) return null;
      const value = SessionCreatedSchema.parse(JSON.parse(raw));
      if (value.credential.client_type !== "native" || !value.credential.access_token || value.credential.csrf_token !== null ||
        Date.parse(value.credential.expires_at) <= this.now()) throw new CredentialUnavailable();
      return value;
    });
  }
  async readToken(sessionId: string): Promise<string | null> {
    const value = await this.load(); return value?.session.session_id === sessionId ? value.credential.access_token : null;
  }
  async clear(): Promise<void> { await this.secure(() => this.port.remove(key), true); }
}
