import type { OperationId, OperationInputs, OperationOutputs, SessionVersion } from "@floodops/contracts";
import type { RequestScope } from "./lifecycle";

export type FetchAdapter = (input: string, init: RequestInit) => Promise<Response>;
export type Credential = { kind: "none" } | { kind: "web"; csrfToken: string | null } | { kind: "native"; accessToken: string };
export interface CredentialContext { operationId: OperationId; sessionId: string | undefined; signal: AbortSignal }
export type CredentialProvider = (context: CredentialContext) => Credential | Promise<Credential>;
export interface RequestOptions { signal?: AbortSignal; scope?: RequestScope }
export interface ClientResponse<T> {
  body: T;
  status: number;
  etag: string | null;
  version: SessionVersion | null;
  requestId: string | null;
  retryAfterMs: number | null;
}
export interface PreparedRequest<I extends OperationId> {
  readonly operationId: I;
  readonly idempotencyKey: string | null;
  send(options?: RequestOptions): Promise<ClientResponse<OperationOutputs[I]>>;
}
export interface RetryPolicy { maxRetries: number; baseDelayMs: number; maxDelayMs: number }
export interface ClientOptions {
  baseUrl: string;
  fetch?: FetchAdapter;
  credentials: CredentialProvider;
  getRetry?: Partial<RetryPolicy>;
  wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
  random?: () => number;
  now?: () => number;
}
export type { OperationId, OperationInputs, OperationOutputs };
