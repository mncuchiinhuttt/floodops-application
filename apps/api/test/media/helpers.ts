import { env, SELF } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import type { Media, MediaUpload } from "@floodops/contracts";
import type { MediaBindings } from "../../src/features/media/index";
declare const __SOURCE_PNG__: number[];
export const png = () => new Uint8Array(__SOURCE_PNG__);
export const bindings = env as unknown as MediaBindings;
export const key = () => crypto.randomUUID().replaceAll("-", "");
export interface Member { id: string; participant: string; token: string; cookie: string | null; csrf: string | null; etag: string }
export const headers = (member: Member, extra: Record<string, string> = {}) => ({ ...(member.cookie
  ? { Cookie: member.cookie, Origin: "https://floodops.test", "X-CSRF-Token": member.csrf! } : { Authorization: `Bearer ${member.token}` }), ...extra });
export function call(path: string, init?: RequestInit): Promise<Response> { return SELF.fetch(`https://floodops.test/api/v1${path}`, init); }
export async function create(client_type: "native" | "web" = "native", scenario_id = "scn_functional1"): Promise<Member> {
  const response = await call("/sessions", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key(), "X-Client-Request-Scope": key(),
    "CF-Connecting-IP": "192.0.2.18", ...(client_type === "web" ? { Origin: "https://floodops.test" } : {}) },
    body: JSON.stringify({ scenario_id, scenario_version: "1", client_type }) });
  if (response.status !== 201) throw new Error(`Create failed ${response.status}`);
  const data = parseSchema("SessionCreatedResponse", await response.json()).data!, cookie = response.headers.get("Set-Cookie")?.split(";")[0] ?? null;
  return { id: data.session.session_id, participant: data.participant.participant_id, token: data.credential.access_token ?? cookie?.split("=")[1] ?? "",
    cookie, csrf: data.credential.csrf_token, etag: response.headers.get("ETag")! };
}
export async function join(owner: Member, role: "driver" | "contributor" | "viewer", bound_entity_id: string | null): Promise<Member> {
  const invitation = await call(`/sessions/${owner.id}/invitations`, { method: "POST", headers: headers(owner, { "Content-Type": "application/json", "Idempotency-Key": key() }),
    body: JSON.stringify({ role, bound_entity_id, expires_in_seconds: 900 }) });
  const invite = parseSchema("InviteResponse", await invitation.json()).data!;
  const response = await call("/session-claims", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key() },
    body: JSON.stringify({ session_id: owner.id, claim_token: invite.claim_token, client_type: "native" }) });
  const data = parseSchema("SessionCreatedResponse", await response.json()).data!;
  return { id: owner.id, participant: data.participant.participant_id, token: data.credential.access_token!, cookie: null, csrf: null, etag: response.headers.get("ETag")! };
}
export async function seedAsset(): Promise<void> { await bindings.SCENARIO_ASSETS!.put("assets/asset_synthetic01", png()); }
export async function reserve(member: Member, bytes = png(), type = "image/png", requestKey = key()): Promise<MediaUpload> {
  const response = await call(`/sessions/${member.id}/media-uploads`, { method: "POST", headers: headers(member, { "Content-Type": "application/json", "Idempotency-Key": requestKey }),
    body: JSON.stringify({ content_type: type, byte_length: bytes.length, original_filename: "synthetic.png" }) });
  if (response.status !== 201) throw new Error(`Reserve failed ${response.status}`);
  return parseSchema("MediaUploadResponse", await response.json()).data!;
}
export async function put(member: Member, upload: MediaUpload, bytes = png(), requestKey = key()): Promise<Response> {
  return call(`/sessions/${member.id}/media-uploads/${upload.upload_id}/content`, { method: "PUT", headers: headers(member, { "Content-Type": "application/octet-stream", "Idempotency-Key": requestKey }), body: bytes });
}
export async function complete(member: Member, upload: MediaUpload, requestKey = key()): Promise<Response> {
  return call(`/sessions/${member.id}/media-uploads/${upload.upload_id}/completion`, { method: "POST", headers: headers(member, { "Content-Type": "application/json", "Idempotency-Key": requestKey }), body: JSON.stringify({ confirm_uploaded: true }) });
}
export async function ready(member: Member, bytes = png(), type = "image/png"): Promise<{ upload: MediaUpload; media: Media }> {
  const upload = await reserve(member, bytes, type), content = await put(member, upload, bytes);
  if (content.status !== 200) throw new Error(`Upload failed ${content.status}`);
  const completed = await complete(member, upload);
  if (completed.status !== 201) throw new Error(`Complete failed ${completed.status}: ${await completed.text()}`);
  return { upload, media: parseSchema("MediaResponse", await completed.json()).data! };
}
