import { QueryClient } from "@tanstack/react-query";
import { ApiClient, ApiError, RequestCancelledError, RequestScope, webCredentials, type ClientOptions } from "@floodops/api-client";
import { IdentitySchema, type Identity, type Meta, type SessionCreated } from "@floodops/contracts";
import { createBoundClient, type ClientContext } from "../shared/client-context";
import { createReportClient } from "../features/reports/client";
import { createPlanningClient } from "../features/planning/client";

export interface RuntimeSnapshot { identity: Identity | null; online: boolean; epoch: number; eventsPaused: boolean }
export class WebRuntime {
  readonly queries = new QueryClient({ defaultOptions: {
    queries: { retry: false, retryOnMount: false, refetchOnWindowFocus: false, refetchOnReconnect: false, staleTime: 5000, networkMode: "always" },
    mutations: { retry: false, networkMode: "always" },
  } });
  readonly api: ApiClient;
  eventMeta: Meta | null = null;
  readonly bound;
  readonly reports;
  readonly planning;
  private state: RuntimeSnapshot = { identity: null, online: true, epoch: 0, eventsPaused: false };
  private scope: RequestScope | null = null;
  private streams = new Set<RequestScope>();
  private listeners = new Set<() => void>();
  private identityRequest: { sessionId: string; promise: Promise<Identity>; controller: AbortController } | null = null;
  constructor(options: Pick<ClientOptions, "fetch" | "baseUrl"> & { now?: () => number } = { baseUrl: "/api/v1" }) {
    this.now = options.now ?? Date.now;
    this.api = new ApiClient({ ...options, credentials: webCredentials(() => this.state.identity?.csrf_token ?? null), getRetry: { maxRetries: 0 } });
    this.bound = createBoundClient(this.api, () => this.context(), context => { if (this.scope === context.scope) this.clear(); });
    this.reports = createReportClient(this.bound); this.planning = createPlanningClient(this.bound);
  }
  readonly now: () => number;
  snapshot = (): RuntimeSnapshot => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private emit(): void { this.listeners.forEach(listener => listener()); }
  setOnline(online: boolean): void { if (online !== this.state.online) { this.state = { ...this.state, online }; this.emit(); } }
  registerStream(scope: RequestScope) { this.streams.add(scope); return () => { this.streams.delete(scope); }; }
  pauseEvents(paused: boolean): void {
    if (paused) { this.streams.forEach(scope => scope.cancel()); this.streams.clear(); this.identityRequest?.controller.abort(); this.identityRequest = null; }
    this.state = { ...this.state, eventsPaused: paused }; this.emit();
  }
  context(): ClientContext {
    if (!this.state.identity || !this.scope) throw new RequestCancelledError();
    return { identity: this.state.identity, online: this.state.online, now: this.now(), scope: this.scope };
  }
  /** Identity responses stay in memory, outside query caches and browser storage. */
  adopt(value: Identity): Identity {
    const identity = IdentitySchema.parse(value), previous = this.state.identity;
    const changed = !previous || previous.session.session_id !== identity.session.session_id || previous.session.generation !== identity.session.generation ||
      previous.participant.participant_id !== identity.participant.participant_id || previous.participant.bound_entity_id !== identity.participant.bound_entity_id ||
      previous.participant.role !== identity.participant.role || previous.participant.permissions.join() !== identity.participant.permissions.join();
    if (changed) { this.clear(); this.scope = new RequestScope(identity.session.session_id, identity.session.generation); }
    this.state = { ...this.state, identity }; this.emit(); return identity;
  }
  adoptCreated(value: SessionCreated, meta?: Meta): Identity {
    if (value.credential.client_type !== "web" || value.credential.access_token !== null || !value.credential.csrf_token) throw new RequestCancelledError();
    const identity = this.adopt({ participant: value.participant, session: value.session, csrf_token: value.credential.csrf_token });
    this.eventMeta = meta ?? null; return identity;
  }
  clear(): void {
    const old = this.state.identity;
    this.streams.forEach(scope => scope.cancel()); this.streams.clear();
    this.scope?.cancel(); if (old) this.api.cancelSession(old.session.session_id);
    this.identityRequest?.controller.abort();
    this.scope = null; this.identityRequest = null; this.eventMeta = null;
    void this.queries.cancelQueries(); this.queries.clear();
    this.state = { ...this.state, identity: null, eventsPaused: false, epoch: this.state.epoch + 1 }; this.emit();
  }
  ensureIdentity(sessionId: string, signal?: AbortSignal, refresh = false): Promise<Identity> {
    if (this.state.eventsPaused || signal?.aborted) return Promise.reject(new RequestCancelledError());
    if (!refresh && this.state.identity?.session.session_id === sessionId) return Promise.resolve(this.state.identity);
    if (this.identityRequest?.sessionId === sessionId) {
      const current = this.identityRequest, epoch = this.state.epoch;
      return refresh ? current.promise.catch(() => undefined).then(() => {
        if (this.state.epoch !== epoch || this.state.eventsPaused || current.controller.signal.aborted || signal?.aborted) throw new RequestCancelledError();
        return this.ensureIdentity(sessionId, signal, true);
      }) : current.promise;
    }
    const epoch = this.state.epoch, controller = new AbortController();
    const abort = () => controller.abort(); signal?.addEventListener("abort", abort, { once: true });
    const promise = this.api.request("getIdentity", { path: { session_id: sessionId } }, { signal: controller.signal }).then(response => {
      if (this.state.epoch !== epoch || controller.signal.aborted || signal?.aborted) throw new RequestCancelledError();
      const identity = this.adopt(response.body.data); this.eventMeta = response.body.meta; return identity;
    }).catch(error => { if (this.state.epoch === epoch && !controller.signal.aborted && error instanceof ApiError && [401, 410].includes(error.status)) this.clear(); throw error; })
      .finally(() => { signal?.removeEventListener("abort", abort); if (this.identityRequest?.promise === promise) this.identityRequest = null; });
    this.identityRequest = { sessionId, promise, controller }; return promise;
  }
  async refresh(signal?: AbortSignal): Promise<Identity> { return this.ensureIdentity(this.context().identity.session.session_id, signal, true); }
  dispose(): void { this.clear(); this.listeners.clear(); }
}
