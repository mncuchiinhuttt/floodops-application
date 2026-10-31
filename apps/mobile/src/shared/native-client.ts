import { ApiClient, ApiError, TransportError, RequestScope, nativeCredentials, type FetchAdapter } from "@floodops/api-client";
import { formatEtag, operations, type OperationId, type OperationInputs, type OperationOutputs, type Permission } from "@floodops/contracts";
import { accessReason, commandReason, type MobileContext } from "./session-context";
export interface NativeCredentialPort { readToken(sessionId: string): Promise<string | null> }
/** SecureStore is supplied by the future native bootstrap, never replaced by local storage here. */
export function createNativeApi(baseUrl: string, credentials: NativeCredentialPort, fetch?: FetchAdapter): ApiClient {
  return new ApiClient({ baseUrl, credentials: async context => nativeCredentials(() => context.sessionId
    ? credentials.readToken(context.sessionId) : null)(context), fetch });
}
export class NativeAccessError extends Error { override readonly name = "NativeAccessError"; }
export class NativeSessionClient {
  readonly scope: RequestScope;
  private active = true;
  private requiresRefresh = false;
  constructor(private readonly api: ApiClient, readonly context: MobileContext) {
    this.scope = new RequestScope(context.session.session_id, context.session.generation);
  }
  private async read<I extends OperationId>(operation: I, input: OperationInputs[I], permission: Permission) {
    this.guard(operation, permission, false);
    return this.api.request(operation, input, { scope: this.scope });
  }
  private async command<I extends OperationId>(operation: I, input: OperationInputs[I], permission: Permission) {
    this.guard(operation, permission, true);
    try {
      const result = await this.api.request(operation, input, { scope: this.scope });
      if (operations[operation].requiresRevision) this.requiresRefresh = true;
      if (operation === "resetSession") this.invalidate();
      return result;
    } catch (error) {
      if (error instanceof ApiError && [401, 403, 410].includes(error.status)) this.invalidate();
      if (error instanceof TransportError || (error instanceof ApiError && [409, 412].includes(error.status))) this.requiresRefresh = true;
      throw error;
    }
  }
  headers(idempotencyKey: string) {
    return { "If-Match": formatEtag(this.context.session), "Idempotency-Key": idempotencyKey };
  }
  snapshot() { return this.read("getSessionSnapshot", { path: this.path }, "operations:read"); }
  graph() { return this.read("getSessionGraph", { path: this.path }, "scenario:read"); }
  sources(query?: OperationInputs["listSources"]["query"]) { return this.read("listSources", { path: this.path, query }, "knowledge:read"); }
  knowledge() { return this.read("getKnowledge", { path: this.path }, "knowledge:read"); }
  clock() { return this.read("getSimulationClock", { path: this.path }, "session:read"); }
  events(query: OperationInputs["getEvents"]["query"]) { return this.read("getEvents", { path: this.path, query }, "session:read"); }
  report(reportId: string) { return this.read("getReport", { path: { ...this.path, report_id: reportId } }, this.reportReadPermission); }
  reports(query?: OperationInputs["listReports"]["query"]) { return this.read("listReports", { path: this.path, query }, this.reportReadPermission); }
  private get reportReadPermission(): Permission {
    return this.context.participant.role === "dispatcher" ? "reports:review" : this.context.participant.role === "driver" ? "driver:self:read" : "contributor:self:read";
  }
  results() { return this.read("getResults", { path: this.path }, "results:read"); }
  decidePlan(planId: string, body: OperationInputs["decidePlanActions"]["body"], key: string) {
    return this.command("decidePlanActions", { path: { ...this.path, plan_id: planId }, body, headers: this.headers(key) }, "planning:decide");
  }
  executePlan(planId: string, body: OperationInputs["executePlan"]["body"], key: string) {
    return this.command("executePlan", { path: { ...this.path, plan_id: planId }, body, headers: this.headers(key) }, "planning:execute");
  }
  advance(target: number, key: string) {
    return this.command("advanceSimulation", { path: this.path, body: { target_sim_minute: target }, headers: this.headers(key) }, "simulation:advance");
  }
  reset(body: OperationInputs["resetSession"]["body"], key: string) {
    return this.command("resetSession", { path: this.path, body, headers: this.headers(key) }, "simulation:reset");
  }
  driverDashboard() { return this.read("getOwnDriverDashboard", { path: this.path }, "driver:self:read"); }
  contributorDashboard() { return this.read("getOwnContributorDashboard", { path: this.path }, "contributor:self:read"); }
  submitReport(body: OperationInputs["submitReport"]["body"], key: string) {
    return this.command("submitReport", { path: this.path, headers: this.headers(key), body }, "reports:submit");
  }
  reviewReport(reportId: string, body: OperationInputs["reviewReport"]["body"], key: string) {
    return this.command("reviewReport", { path: { ...this.path, report_id: reportId }, headers: this.headers(key), body }, "reports:review");
  }
  requestImageReview(reportId: string, key: string) {
    return this.command("createReportImageReview", { path: { ...this.path, report_id: reportId },
      headers: { "Idempotency-Key": key }, body: {} }, "reports:review");
  }
  imageReview(reportId: string) {
    return this.read("getReportImageReview", { path: { ...this.path, report_id: reportId } }, "reports:review");
  }
  invalidate(): void {
    this.active = false; this.scope.cancel(); this.api.cancelSession(this.context.session.session_id);
  }
  private get path() { return { session_id: this.context.session.session_id }; }
  private guard<I extends OperationId>(id: I, permission: Permission, mutation: boolean): void {
    if (!this.active) throw new NativeAccessError("Rejoin the session before sending.");
    if (mutation && this.requiresRefresh) throw new NativeAccessError("Refresh authoritative state before a new command; the previous outcome must be inspected.");
    const operation = operations[id];
    if ((operation.method === "GET") === mutation) throw new NativeAccessError("Use the matching read or command path.");
    const reason = mutation ? commandReason(this.context, permission) : accessReason(this.context, permission);
    if (reason || !(operation.roles as readonly string[]).includes(this.context.participant.role)) {
      throw new NativeAccessError(reason ?? "Operation is outside your server capability.");
    }
  }
}
export type NativeOperationResult<I extends OperationId> = OperationOutputs[I];
