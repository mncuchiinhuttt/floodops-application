import { operations, ContractValidationError, type OperationId, type OperationInputs, type OperationOutputs, type Meta } from "@floodops/contracts";
import { applyCredential } from "./http/auth";
import { ApiError, TransportError, throwIfAborted } from "./http/errors";
import { abortable, RequestTracker, scopedStream } from "./http/lifecycle";
import { captureRequest, validateBaseUrl, type CapturedRequest } from "./http/request";
import { decodeResponse } from "./http/response";
import { canRetry, retryDelay, retryPolicy, waitForRetry } from "./http/retry";
import type { ClientOptions, ClientResponse, PreparedRequest, RequestOptions } from "./http/types";

export class ApiClient {
  private readonly tracker = new RequestTracker();
  private readonly baseUrl;
  private readonly retry;
  constructor(private readonly options: ClientOptions) {
    this.baseUrl = validateBaseUrl(options.baseUrl, options.developmentLanOrigin);
    this.retry = retryPolicy(options.getRetry);
  }
  cancelSession(sessionId: string): void { this.tracker.cancelSession(sessionId); }
  prepare<I extends OperationId>(id: I, input: OperationInputs[I]): PreparedRequest<I> {
    const captured = captureRequest(this.baseUrl, id, input);
    return Object.freeze({
      operationId: id,
      idempotencyKey: captured.headers["Idempotency-Key"] ?? null,
      send: (options: RequestOptions = {}) => this.send(id, captured, options),
    });
  }
  request<I extends OperationId>(id: I, input: OperationInputs[I], options: RequestOptions = {}): Promise<ClientResponse<OperationOutputs[I]>> {
    return this.prepare(id, input).send(options);
  }
  private async send<I extends OperationId>(id: I, captured: CapturedRequest, options: RequestOptions): Promise<ClientResponse<OperationOutputs[I]>> {
    const operation = operations[id];
    const lifecycle = this.tracker.begin(captured.sessionId, options);
    const { signal, release } = lifecycle;
    let streaming = false;
    try {
      for (let attempt = 0; ; attempt++) {
        try {
          throwIfAborted(signal);
          const headers = new Headers(captured.headers);
          headers.set("Accept", operation.responseKind === "stream" ? "text/event-stream" : operation.responseKind === "binary" ? "image/jpeg, image/png" : "application/json");
          if (captured.body !== undefined) headers.set("Content-Type", captured.body instanceof Uint8Array ? "application/octet-stream" : "application/json");
          const credential = await abortable(Promise.resolve(this.options.credentials({ operationId: id, sessionId: captured.sessionId, signal })), signal);
          const credentials = applyCredential(headers, credential, operation.roles.length > 0, operation.method !== "GET");
          throwIfAborted(signal);
          let response: Response;
          try {
            response = await abortable((this.options.fetch ?? fetch)(captured.url, {
              method: operation.method, headers, credentials, signal, cache: "no-store", redirect: "error",
              body: captured.body instanceof Uint8Array ? new Uint8Array(captured.body).buffer : captured.body,
            }), signal);
          } catch { throwIfAborted(signal); throw new TransportError(); }
          const result = await abortable(decodeResponse(id, response, (this.options.now ?? Date.now)()), signal);
          throwIfAborted(signal);
          if (operation.responseKind === "json" && id !== "resetSession") {
            const meta = (result.body as { meta: Meta }).meta;
            if ((captured.sessionId && meta.session_id && captured.sessionId !== meta.session_id) ||
              (options.scope && meta.generation !== undefined && options.scope.generation !== meta.generation)) {
              throw new ContractValidationError(`${id}.scope`, [{ path: "meta", code: "session_generation_mismatch" }]);
            }
          }
          if (operation.responseKind === "stream") {
            result.body = scopedStream(result.body as ReadableStream<Uint8Array>, signal, release) as OperationOutputs[I];
            streaming = true;
          }
          return result;
        } catch (error) {
          throwIfAborted(signal);
          if (operation.method !== "GET" || attempt >= this.retry.maxRetries || !canRetry(error)) throw error;
          const delay = retryDelay(error, attempt, this.retry, this.options.random ?? Math.random);
          if (delay === null) throw error;
          await (this.options.wait ?? waitForRetry)(delay, signal);
        }
      }
    } finally { if (!streaming) release(); }
  }
}
export { ApiError };
