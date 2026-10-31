import { operations, parseEtag, parseOperationInput, ContractValidationError, type OperationId, type OperationInputs } from "@floodops/contracts";

export interface CapturedRequest {
  url: string;
  headers: Readonly<Record<string, string>>;
  body: string | Uint8Array | undefined;
  sessionId: string | undefined;
}
interface RequestShape {
  path?: Record<string, string>;
  query?: Record<string, string | number>;
  headers?: Record<string, string>;
  body?: unknown;
}
function invalid(path: string): never {
  throw new ContractValidationError("request", [{ path, code: "invalid_transport_input" }]);
}
export function validateBaseUrl(baseUrl: string): string {
  if (baseUrl.startsWith("/") && !baseUrl.startsWith("//")) {
    if (!/^\/[A-Za-z0-9/_-]+$/.test(baseUrl)) invalid("baseUrl");
  } else {
    const url = new URL(baseUrl);
    if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "127.0.0.1"))) invalid("baseUrl");
  }
  return baseUrl.replace(/\/$/, "");
}
export function captureRequest<I extends OperationId>(baseUrl: string, id: I, value: OperationInputs[I]): CapturedRequest {
  const input = parseOperationInput(id, value) as RequestShape;
  const operation = operations[id];
  const path = operation.path.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const part = input.path?.[key];
    if (!part) return invalid(`path.${key}`);
    return encodeURIComponent(part);
  });
  const query = new URLSearchParams();
  Object.entries(input.query ?? {}).forEach(([key, val]) => query.set(key, String(val)));
  const headers = { ...input.headers };
  const sessionId = input.path?.session_id ?? (id === "claimSession" ? (input.body as { session_id: string }).session_id : undefined);
  if (headers["If-Match"] && parseEtag(headers["If-Match"]).session_id !== sessionId) invalid("headers.If-Match");
  const body = input.body instanceof Uint8Array ? new Uint8Array(input.body) : input.body === undefined ? undefined : JSON.stringify(input.body);
  return { url: baseUrl + path + (query.size ? `?${query}` : ""), headers: Object.freeze(headers), body, sessionId };
}
