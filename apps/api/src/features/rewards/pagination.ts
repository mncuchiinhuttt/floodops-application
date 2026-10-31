import { fail } from "../../shared/index";
import type { Award } from "@floodops/contracts";
const encoder = new TextEncoder();
const encode = (bytes: Uint8Array) => btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join("")).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
function decode(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) fail(410, "EVENT_CURSOR_EXPIRED");
  return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), char => char.charCodeAt(0));
}
export async function paginateAwards(awards: readonly Award[], query: Record<string, string>, meta: Record<string, unknown>, secret: string) {
  if (Object.keys(query).some(key => !["limit", "cursor"].includes(key))) fail(422, "INVALID_SCHEMA");
  const limit = query.limit === undefined ? 50 : /^[0-9]+$/.test(query.limit) ? Number(query.limit) : NaN;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || (query.cursor?.length ?? 0) > 2048) fail(422, "INVALID_SCHEMA");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const binding = [meta.session_id, meta.generation, meta.revision, limit];
  let offset = 0;
  if (query.cursor) {
    try {
      const [body, signature, extra] = query.cursor.split(".");
      if (!body || !signature || extra) fail(410, "EVENT_CURSOR_EXPIRED");
      const bytes = decode(body);
      if (!await crypto.subtle.verify("HMAC", key, new Uint8Array(decode(signature)).buffer, new Uint8Array(bytes).buffer)) fail(410, "EVENT_CURSOR_EXPIRED");
      const payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      if (JSON.stringify(payload.binding) !== JSON.stringify(binding) || payload.purpose !== "review-awards-v1"
        || !Number.isSafeInteger(payload.offset) || payload.offset < 0 || payload.offset > awards.length) fail(410, "EVENT_CURSOR_EXPIRED");
      offset = payload.offset;
    } catch { fail(410, "EVENT_CURSOR_EXPIRED"); }
  }
  const items = awards.slice(offset, offset + limit), next = offset + items.length;
  let next_cursor: string | null = null;
  if (next < awards.length) {
    const bytes = encoder.encode(JSON.stringify({ purpose: "review-awards-v1", binding, offset: next }));
    next_cursor = `${encode(bytes)}.${encode(new Uint8Array(await crypto.subtle.sign("HMAC", key, bytes)))}`;
  }
  return { items, page: { next_cursor, has_more: next_cursor !== null } };
}
