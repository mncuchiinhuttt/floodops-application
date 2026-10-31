import { ApiError, createIdempotencyKey, RequestCancelledError, type PreparedRequest } from "@floodops/api-client";
import { formatEtag, type ClaimInput, type CreateSessionInput, type InviteInput } from "@floodops/contracts";
import type { WebRuntime } from "../../../app/runtime";
import { FeatureAccessError } from "../../../shared/client-context";

export class SessionCommands {
  private admission: { epoch: number; request: PreparedRequest<"createSession"> | PreparedRequest<"claimSession"> } | null = null;
  constructor(readonly runtime: WebRuntime) {}
  private online(): void { if (!this.runtime.snapshot().online) throw new FeatureAccessError("Đang offline. Xem lại rồi gửi khi có mạng."); }
  create(body: CreateSessionInput, signal?: AbortSignal) {
    this.online(); this.runtime.clear();
    this.admission = { epoch: this.runtime.snapshot().epoch, request: this.runtime.api.prepare("createSession", {
      headers: { "Idempotency-Key": createIdempotencyKey(), "X-Client-Request-Scope": createIdempotencyKey() }, body: { ...body, client_type: "web" },
    }) };
    return this.retryAdmission(signal);
  }
  claim(body: ClaimInput, signal?: AbortSignal) {
    this.online(); this.runtime.clear();
    this.admission = { epoch: this.runtime.snapshot().epoch, request: this.runtime.api.prepare("claimSession", {
      headers: { "Idempotency-Key": createIdempotencyKey() }, body: { ...body, client_type: "web" },
    }) };
    return this.retryAdmission(signal);
  }
  hasAdmission(): boolean { return !!this.admission && this.admission.epoch === this.runtime.snapshot().epoch; }
  async retryAdmission(signal?: AbortSignal) {
    this.online(); const attempt = this.admission;
    if (!attempt || attempt.epoch !== this.runtime.snapshot().epoch) throw new RequestCancelledError();
    let response;
    try { response = await attempt.request.send({ signal }); } catch (error) {
      if (error instanceof ApiError && this.admission === attempt) this.admission = null; throw error;
    }
    if (attempt !== this.admission || attempt.epoch !== this.runtime.snapshot().epoch || signal?.aborted) throw new RequestCancelledError();
    const identity = this.runtime.adoptCreated(response.body.data, response.body.meta); this.admission = null; return identity;
  }
  invite(body: InviteInput) {
    return this.runtime.bound.prepare("createInvitation", "participants:invite", "dispatcher", context => ({
      path: { session_id: context.identity.session.session_id }, headers: { "Idempotency-Key": createIdempotencyKey() }, body,
    })).send();
  }
  revoke(participantId: string) {
    return this.runtime.bound.prepare("revokeParticipant", "participants:revoke", "dispatcher", context => ({
      path: { session_id: context.identity.session.session_id, participant_id: participantId }, headers: { "Idempotency-Key": createIdempotencyKey() },
    })).send();
  }
  async logout() {
    this.online(); const context = this.runtime.context(), epoch = this.runtime.snapshot().epoch;
    this.runtime.pauseEvents(true);
    try { await this.runtime.api.request("logout", { path: { session_id: context.identity.session.session_id }, headers: { "Idempotency-Key": createIdempotencyKey() } }, { scope: context.scope }); }
    finally { if (this.runtime.snapshot().epoch === epoch) this.runtime.clear(); this.runtime.pauseEvents(false); }
  }
  async reset() {
    this.runtime.pauseEvents(true);
    try { const response = await this.runtime.bound.prepare("resetSession", "simulation:reset", "dispatcher", context => ({
      path: { session_id: context.identity.session.session_id }, headers: { ...this.runtime.bound.headers(context, createIdempotencyKey()) }, body: { client_type: "web", confirm: true },
    })).send();
    return this.runtime.adoptCreated(response.body.data.replacement, response.body.meta);
    } finally { this.runtime.pauseEvents(false); }
  }
  async remove() {
    this.runtime.pauseEvents(true);
    try { const response = await this.runtime.bound.prepare("deleteSession", "session:delete", "dispatcher", context => ({
      path: { session_id: context.identity.session.session_id }, headers: { "If-Match": formatEtag(context.identity.session), "Idempotency-Key": createIdempotencyKey() },
    })).send();
    this.runtime.clear(); return response;
    } finally { this.runtime.pauseEvents(false); }
  }
}
