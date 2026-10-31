import type { ApiClient } from "@floodops/api-client";
import { RequestScope } from "@floodops/api-client";
import type { Identity, SessionCreated } from "@floodops/contracts";
import type { CredentialVault } from "../../../shared/native/credential-vault";
export class NativeSessionService {
  private epoch = 0;
  private pending: AbortController | null = null;
  cancelPending(): void { this.epoch++; this.pending?.abort(); }
  async storeReplacement(value: SessionCreated): Promise<void> { const ticket = this.epoch; await this.vault.adopt(value, () => ticket === this.epoch); }
  constructor(readonly api: ApiClient, private readonly vault: CredentialVault, private readonly key: () => string) {}
  async identity(sessionId: string, generation: number): Promise<Identity> {
    const scope = new RequestScope(sessionId, generation);
    try {
      const result = await this.api.request("getIdentity", { path: { session_id: sessionId } }, { scope });
      const saved = await this.vault.load();
      if (!saved || saved.session.session_id !== sessionId || saved.participant.participant_id !== result.body.data.participant.participant_id) throw new Error("Rejoin the correct native principal");
      return result.body.data;
    } finally { scope.cancel(); }
  }
  async adopt(value: SessionCreated, ticket = this.epoch): Promise<Identity> {
    await this.vault.adopt(value, () => ticket === this.epoch);
    if (ticket !== this.epoch) throw new Error("Session join cancelled"); return this.identity(value.session.session_id, value.session.generation);
  }
  async create(scenarioId: string, scenarioVersion: string): Promise<Identity> {
    const ticket = this.epoch; const pending = new AbortController(); this.pending = pending;
    const result = await this.api.request("createSession", { headers: { "Idempotency-Key": this.key(), "X-Client-Request-Scope": this.key() },
      body: { scenario_id: scenarioId, scenario_version: scenarioVersion, client_type: "native" } }, { signal: pending.signal });
    return this.adopt(result.body.data, ticket);
  }
  async claim(sessionId: string, token: string): Promise<Identity> {
    const ticket = this.epoch; const pending = new AbortController(); this.pending = pending;
    const result = await this.api.request("claimSession", { headers: { "Idempotency-Key": this.key() }, body: { session_id: sessionId, claim_token: token, client_type: "native" } }, { signal: pending.signal });
    return this.adopt(result.body.data, ticket);
  }
  async restore(): Promise<Identity> {
    const saved = await this.vault.load(); if (!saved) throw new Error("No stored native capability. Join a session.");
    return this.identity(saved.session.session_id, saved.session.generation);
  }
}
