import type { StatusCode } from "hono/utils/http-status";
import { formatEtag, parseOperationResponse, parseSchema, type OperationId } from "@floodops/contracts";
import { open, validateKey } from "../shared/crypto";
import { errorReply, fail } from "../shared/platform-error";
import type { AppContext, AuthProof, Call, Reply } from "../shared/platform-types";
export function authProof(request: Request): AuthProof | undefined {
  const bearer = request.headers.get("Authorization");
  const cookies = request.headers.get("Cookie")?.split(";").map(c => c.trim()).filter(c => c.startsWith("__Host-floodops_session=")) ?? [];
  if (cookies.length > 1 || (bearer && cookies.length)) fail(401, "UNAUTHENTICATED");
  const token = bearer ? /^Bearer ([A-Za-z0-9_-]{32,512})$/.exec(bearer)?.[1] : cookies[0]?.slice("__Host-floodops_session=".length);
  if (!token) return undefined;
  if (!/^[A-Za-z0-9_-]{32,512}$/.test(token)) fail(401, "UNAUTHENTICATED");
  return { token, transport: bearer ? "bearer" : "cookie", origin: request.headers.get("Origin"), csrf: request.headers.get("X-CSRF-Token") };
}
export async function jsonBody(request: Request, maximum = 65536): Promise<unknown> {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get("Content-Type") ?? "")) fail(415, "INVALID_SCHEMA");
  const reader = request.body?.getReader();
  if (!reader) fail(400, "INVALID_JSON");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const chunk = await reader.read(); if (chunk.done) break;
    length += chunk.value.byteLength;
    if (length > maximum) { await reader.cancel(); fail(413, "INVALID_SCHEMA"); }
    chunks.push(chunk.value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown; }
  catch { fail(400, "INVALID_JSON"); }
}
export function runtimeCall(c: AppContext, kind: string, fields: Partial<Call> = {}): Call {
  const sessionId = parseSchema("Id", c.req.param("session_id"));
  return { kind, sessionId, requestId: c.get("requestId"), auth: authProof(c.req.raw),
    key: c.req.header("Idempotency-Key"), ifMatch: c.req.header("If-Match"), path: new URL(c.req.url).pathname, ...fields };
}
export async function invoke(c: AppContext, call: Call): Promise<Reply> {
  return JSON.parse(await c.env.SESSIONS.get(c.env.SESSIONS.idFromName(call.sessionId)).dispatch(JSON.stringify(call))) as Reply;
}
export async function send(c: AppContext, reply: Reply, operation?: OperationId): Promise<Response> {
  const body = structuredClone(reply.body);
  const headers = new Headers({ "Cache-Control": "no-store", "X-Request-ID": String(body.meta.request_id) });
  if (reply.status !== 204) headers.set("Content-Type", "application/json");
  if (reply.credential) {
    const secret = await open<{ token: string; csrf: string | null }>(c.env, reply.credential.box, reply.credential.aad);
    if (reply.credential.type === "invite") (body.data as Record<string, unknown>).claim_token = secret.token;
    else {
      const data = body.data as Record<string, unknown>;
      const delivery = (data.replacement ?? data) as { credential: Record<string, unknown> };
      delivery.credential.access_token = reply.credential.type === "native" ? secret.token : null;
      delivery.credential.csrf_token = reply.credential.type === "web" ? secret.csrf : null;
      if (reply.credential.type === "web") headers.append("Set-Cookie", `__Host-floodops_session=${secret.token}; HttpOnly; Secure; SameSite=Lax; Path=/`);
    }
  }
  if (reply.clearCookie) headers.append("Set-Cookie", "__Host-floodops_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
  if (typeof body.meta.session_id === "string" && typeof body.meta.generation === "number" && typeof body.meta.revision === "number") headers.set("ETag", formatEtag(body.meta as unknown as { session_id: string; generation: number; revision: number }));
  if (reply.retryAfter) headers.set("Retry-After", String(reply.retryAfter));
  if (reply.status < 400 && reply.status !== 204 && operation) parseOperationResponse(operation, reply.status, body);
  if (reply.status >= 400) parseSchema("ErrorResponse", body);
  return c.newResponse(reply.status === 204 ? null : JSON.stringify(body), { status: reply.status as StatusCode, headers });
}
export function key(c: AppContext): string { return validateKey(c.req.header("Idempotency-Key")); }
export function failure(c: AppContext, error: unknown): Promise<Response> { return send(c, errorReply(error, c.get("requestId"))); }
