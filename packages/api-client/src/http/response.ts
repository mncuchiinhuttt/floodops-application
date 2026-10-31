import { operations, ErrorResponseSchema, parseM1ReviewResult, parseOperationResponse, parseEtag, validate, ContractValidationError, type Meta, type OperationId, type OperationOutputs } from "@floodops/contracts";
import { ApiError, TransportError } from "./errors";
import { parseRetryAfter } from "./retry";
import type { ClientResponse } from "./types";

function malformed(id: OperationId, path: string): never {
  throw new ContractValidationError(`${id}.response`, [{ path, code: "invalid_transport_response" }]);
}
export async function decodeResponse<I extends OperationId>(id: I, response: Response, now: number): Promise<ClientResponse<OperationOutputs[I]>> {
  const operation = operations[id];
  const contentType = response.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase() ?? "";
  const retryAfterMs = parseRetryAfter(response.headers.get("Retry-After"), now);
  const success = response.status >= 200 && response.status < 300;
  if (!(success ? operation.statuses : operation.errorStatuses as readonly number[]).includes(response.status as never)) malformed(id, "status");
  let body: unknown;
  let meta: Meta | undefined;
  if (!success || operation.responseKind === "json") {
    if (contentType !== "application/json") malformed(id, "Content-Type");
    let text: string;
    try { text = await response.text(); } catch { throw new TransportError(); }
    let value: unknown;
    try { value = JSON.parse(text); } catch { return malformed(id, "JSON"); }
    if (!success) {
      const error = validate(ErrorResponseSchema, value, `${id}.error`);
      throw new ApiError(response.status, error, retryAfterMs);
    }
    body = parseOperationResponse(id, response.status, value);
    if (id === "reviewReport") {
      const envelope = body as { data: unknown };
      body = { ...envelope, data: parseM1ReviewResult(envelope.data) };
    }
    meta = (body as { meta: Meta }).meta;
  } else if (operation.responseKind === "empty") {
    if (response.body !== null) malformed(id, "body");
    body = undefined;
  } else {
    if (!(operation.mediaTypes as readonly string[]).includes(contentType) || !response.body) malformed(id, "Content-Type/body");
    if (operation.responseKind === "stream") body = response.body;
    else {
      if (response.headers.get("X-Content-Type-Options") !== "nosniff") malformed(id, "X-Content-Type-Options");
      try { body = new Uint8Array(await response.arrayBuffer()); } catch { throw new TransportError(); }
      if ((body as Uint8Array).byteLength > 5_242_880 || !(body as Uint8Array).byteLength) malformed(id, "byte_length");
    }
  }
  const etag = response.headers.get("ETag");
  const version = etag === null ? null : parseEtag(etag);
  if (version && meta && ((meta.session_id !== undefined && meta.session_id !== version.session_id) ||
    (meta.generation !== undefined && meta.generation !== version.generation) ||
    (meta.revision !== undefined && meta.revision !== version.revision))) malformed(id, "ETag/meta");
  const requestId = response.headers.get("X-Request-Id");
  if (requestId && meta && requestId !== meta.request_id) malformed(id, "X-Request-Id/meta");
  return { body: body as OperationOutputs[I], status: response.status, etag, version, requestId: requestId ?? meta?.request_id ?? null, retryAfterMs };
}
