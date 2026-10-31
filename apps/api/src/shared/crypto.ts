import { fail } from "./platform-error";
import type { AuthProof, PlatformBindings, Proof } from "./platform-types";
const encoder = new TextEncoder();
export function randomToken(): string { return base64(crypto.getRandomValues(new Uint8Array(32))); }
export function randomId(prefix: string): string { return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`; }
function base64(bytes: Uint8Array): string { return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
function unbase64(value: string): Uint8Array<ArrayBuffer> { return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), c => c.charCodeAt(0)); }
export async function hash(value: string): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))].map(n => n.toString(16).padStart(2, "0")).join("");
}
export function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
export async function hmac(secret: string, value: unknown): Promise<string> {
  if (secret.length < 32) fail(503, "CONFIG_INCOMPLETE");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(stable(value))))].map(n => n.toString(16).padStart(2, "0")).join("");
}
async function sealKey(secret: string): Promise<CryptoKey> {
  if (secret.length < 32) fail(503, "CONFIG_INCOMPLETE");
  return crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", encoder.encode(secret)), "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function seal(env: PlatformBindings, data: unknown, aad: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const value = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encoder.encode(aad) }, await sealKey(env.CAPABILITY_SEAL_KEY_ACTIVE), encoder.encode(JSON.stringify(data)));
  return [env.CAPABILITY_SEAL_KEY_ID, base64(iv), base64(new Uint8Array(value))].join(".");
}
export async function open<T>(env: PlatformBindings, box: string, aad: string): Promise<T> {
  const [id, iv, ciphertext] = box.split(".");
  const previous = JSON.parse(env.CAPABILITY_SEAL_KEYS ?? "{}") as Record<string, string>;
  const secret = id === env.CAPABILITY_SEAL_KEY_ID ? env.CAPABILITY_SEAL_KEY_ACTIVE : previous[id ?? ""];
  if (!secret || !iv || !ciphertext) fail(503, "STORAGE_UNAVAILABLE");
  const result = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unbase64(iv), additionalData: encoder.encode(aad) }, await sealKey(secret), unbase64(ciphertext));
  return JSON.parse(new TextDecoder().decode(result)) as T;
}
export async function prepareProof(auth?: AuthProof): Promise<Proof | undefined> {
  if (!auth) return undefined;
  const derivedCsrf = auth.transport === "cookie" ? await hash(`csrf:${auth.token}`) : null;
  return { ...auth, tokenDigest: await hash(auth.token), derivedCsrf, csrfDigest: auth.csrf ? await hash(auth.csrf) : null };
}
export function validateKey(value?: string): string {
  // A server cannot measure client entropy; enforce bounded opaque values and reject trivial repetitions.
  if (!value || !/^[A-Za-z0-9_-]{22,128}$/.test(value) || new Set(value).size < 6) fail(422, "INVALID_SCHEMA");
  return value;
}
