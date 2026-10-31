import { parseSchema, type Event, type Role } from "@floodops/contracts";
import { composed, finishStream, memberHeaders } from "../capabilities/composed-http-fixtures";
import { requestKey, type Fixture } from "../capabilities/helpers";
export async function joinComposed(owner: Fixture, role: Role, clientType: "native" | "web" = "native"): Promise<Fixture> {
  const response = await composed(`/sessions/${owner.id}/invitations`, { method: "POST", headers: memberHeaders(owner, { "Content-Type": "application/json", "Idempotency-Key": requestKey() }),
    body: JSON.stringify({ role, bound_entity_id: role === "driver" ? "drv_moto01" : role === "contributor" ? "contributor_functional1" : null, expires_in_seconds: 900 }) });
  if (response.status !== 201) throw new Error(`Invite failed ${response.status}`);
  const invite = parseSchema("InviteResponse", await response.json()).data!;
  const claimed = await composed("/session-claims", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey(), ...(clientType === "web" ? { Origin: "https://floodops.test" } : {}) },
    body: JSON.stringify({ session_id: owner.id, claim_token: invite.claim_token, client_type: clientType }) });
  if (claimed.status !== 201) throw new Error(`Claim failed ${claimed.status}`);
  const data = parseSchema("SessionCreatedResponse", await claimed.json()).data!;
  const cookie = claimed.headers.get("Set-Cookie")?.split(";")[0] ?? null;
  return { id: owner.id, etag: owner.etag, participant: data.participant.participant_id,
    token: data.credential.access_token ?? cookie?.split("=")[1] ?? "", cookie, csrf: data.credential.csrf_token };
}
export function resetComposed(owner: Fixture, key = requestKey(), auth = owner): Promise<Response> {
  return composed(`/sessions/${owner.id}/resets`, { method: "POST", headers: memberHeaders(auth, { "Content-Type": "application/json", "Idempotency-Key": key, "If-Match": owner.etag }),
    body: JSON.stringify({ client_type: owner.cookie ? "web" : "native", confirm: true }) });
}
export async function openComposedStream(member: Fixture, after = 0): Promise<Response> {
  const r = await composed(`/sessions/${member.id}/events/stream?after=${after}`, { headers: memberHeaders(member) });
  if (r.status !== 200) throw new Error(`Stream open failed ${r.status}`);
  return r;
}
export async function readUntilClosed(response: Response): Promise<string> {
  const reader = response.body!.getReader(); const decoder = new TextDecoder(); let text = ""; let timedOut = false;
  const deadline = setTimeout(() => { timedOut = true; void reader.cancel(); }, 8000);
  try {
    for (;;) { const next = await reader.read(); text += decoder.decode(next.value, { stream: !next.done }); if (next.done) break; }
  } finally { clearTimeout(deadline); await reader.cancel(); await finishStream(response); }
  if (timedOut) throw new Error("Stream did not close within the terminal-delivery bound");
  return text;
}
export interface Frame { event: string; id: string | null; data: unknown }
export function frames(text: string): Frame[] {
  return text.split("\n\n").flatMap(block => {
    const lines = block.split("\n"); const data = lines.filter(l => l.startsWith("data: ")).map(l => l.slice(6)).join("\n");
    if (!data) return [];
    return [{ event: lines.find(l => l.startsWith("event: "))?.slice(7) ?? "message", id: lines.find(l => l.startsWith("id: "))?.slice(4) ?? null, data: JSON.parse(data) as unknown }];
  });
}
export function resetEvents(text: string): Event[] { return frames(text).filter(f => f.event === "session_reset").map(f => parseSchema("Event", f.data)); }
