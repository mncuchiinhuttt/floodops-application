import { parseSchema } from "@floodops/contracts";
import type { OperationId } from "@floodops/contracts";
import { invoke, runtimeCall, send } from "../../app/index";
import { fail } from "../../shared/index";
import type { AppContext, Reply } from "../../shared/index";

export async function view(c: AppContext, name: string): Promise<Reply> {
  return invoke(c, runtimeCall(c, "view", { name }));
}
export async function mapped(c: AppContext, reply: Reply, operation: OperationId, project: (data: unknown) => unknown): Promise<Response> {
  if (reply.status < 400) reply = { ...reply, body: { ...reply.body, data: project(reply.body.data) } };
  return send(c, reply, operation);
}
export function object(raw: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).some(key => !keys.includes(key))) fail(422, "INVALID_SCHEMA");
  return raw as Record<string, unknown>;
}
export function resourceId(c: AppContext, name: string): string { return parseSchema("Id", c.req.param(name)); }
export async function stableId(prefix: string, parts: readonly string[]): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(parts)));
  return `${prefix}_${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("").slice(0,32)}`;
}
export function successful(reply: Reply, status: number): Reply { return reply.status >= 400 ? reply : { ...reply, status }; }
export async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>);
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
}

export function requestKey(c: AppContext): string {
  const value = c.req.header("Idempotency-Key");
  if (!value || !/^[A-Za-z0-9_-]{22,128}$/.test(value) || new Set(value).size < 6) fail(422, "INVALID_SCHEMA");
  return value;
}
