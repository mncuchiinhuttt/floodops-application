import { afterEach, expect, it } from "vitest";
import { reset, SELF } from "cloudflare:test";
import { ApiClient, EventCursor, EventSequenceGap, RequestScope, nativeCredentials, parseSse, watchEvents } from "@floodops/api-client";
import { appendMixedPage, contributor } from "./filtered-stream-fixture";
afterEach(reset);
// SELF is a server RPC binding. Native bearer stays in headers; client scope fences cancellation.
function workerRequest(init: RequestInit): RequestInit {
  return { method: init.method, headers: Object.fromEntries(new Headers(init.headers).entries()),
    body: init.body };
}
it("confirms an ordinary filtered SSE gap is recoverable via its authorized JSON page", async () => {
  const member = await contributor(), scope = new RequestScope(member.sid, member.generation);
  const deadline = setTimeout(() => scope.cancel(), 8000);
  const client = new ApiClient({ baseUrl: "https://floodops.test/api/v1", credentials: nativeCredentials(() => member.token), getRetry: { maxRetries: 0 }, fetch: (url, init) => SELF.fetch(url, workerRequest(init)) });
  let iterator: ReturnType<typeof parseSse> | undefined;
  try {
    const response = await client.request("streamEvents", { path: { session_id: member.sid }, query: { after: member.meta.event_sequence! } }, { scope });
    const fixture = await appendMixedPage(member.sid);
    const cursor = new EventCursor(member.sid, member.generation, member.meta.event_sequence!);
    iterator = parseSse(response.body, scope.signal);
    const frame = await iterator.next();
    expect(frame.done).toBe(false);
    if (frame.done) throw new Error("Missing visible event");
    expect(() => cursor.applyFrame(frame.value)).toThrow(EventSequenceGap);
    const page = await client.request("getEvents", { path: { session_id: member.sid }, query: { after: cursor.after, limit: 500 } }, { scope });
    const accepted = cursor.applyPage(page.body.data);
    expect(accepted.map(event => event.event_sequence)).toEqual([fixture.visible]);
    expect(accepted.map(event => event.type)).toEqual(["state_changed"]);
    expect(cursor.applyFrame(frame.value)).toBeNull();
    expect(cursor.after).toBe(fixture.visible);
  } finally { scope.cancel(); clearTimeout(deadline); await iterator?.return(undefined); }
});
it("public watchEvents delivers a mixed-page visible event exactly once with one extra catch-up and no refresh", async () => {
  const member = await contributor(), scope = new RequestScope(member.sid, member.generation);
  const deadline = setTimeout(() => scope.cancel(), 8000);
  let pages = 0, streams = 0, refreshed = 0, visible = -1;
  const client = new ApiClient({ baseUrl: "https://floodops.test/api/v1", credentials: nativeCredentials(() => member.token), getRetry: { maxRetries: 0 }, fetch: async (url, init) => {
    const response = await SELF.fetch(url, workerRequest(init));
    if (new URL(url).pathname.endsWith("/events/stream")) { streams++; visible = (await appendMixedPage(member.sid)).visible; }
    else pages++;
    return response;
  } });
  const watcher = watchEvents(client, { scope, initialMeta: member.meta, maxReconnects: 0,
    refresh: async () => { refreshed++; return member.meta; } });
  try {
    const event = await watcher.next();
    expect(event.done).toBe(false);
    expect(event.value?.event_sequence).toBe(visible);
    expect(event.value?.type).toBe("state_changed");
    expect(pages).toBe(2); // Initial authorized catch-up, then one recovery for the hidden gap.
    expect(streams).toBe(1);
    expect(refreshed).toBe(0);
  } finally { scope.cancel(); clearTimeout(deadline); await watcher.return(undefined); }
});
