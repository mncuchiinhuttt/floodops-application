import { expect, test } from "bun:test";
import { ApiClient, RequestScope, watchEvents, RequestCancelledError } from "../src";
import { byteStream, errorResponse, event, eventFrame, meta, response, sessionId } from "./fixtures";
const baseUrl = "https://floodops.example/api/v1";
const credentials = () => ({ kind: "native" as const, accessToken: "synthetic-token-".repeat(3) });
test("stream interruption reconnects with JSON catch-up and the last cursor", async () => {
  const seen: string[] = [], waits: number[] = []; let streams = 0;
  const client = new ApiClient({ baseUrl, credentials, getRetry: { maxRetries: 0 }, fetch: async url => {
    seen.push(url); const after = Number(new URL(url).searchParams.get("after"));
    if (!url.includes("/stream")) return response({ events: after === 1 ? [event(2)] : [], next_sequence: after === 1 ? 2 : after, has_more: false });
    if (++streams === 1) {
      let sent = false;
      return new Response(new ReadableStream<Uint8Array>({ pull(c) {
        if (!sent) { sent = true; c.enqueue(new TextEncoder().encode(eventFrame(1))); }
        else c.error(new TypeError("network interruption"));
      } }), { headers: { "Content-Type": "text/event-stream" } });
    }
    return new Response(byteStream(eventFrame(3)), { headers: { "Content-Type": "text/event-stream" } });
  } });
  const watcher = watchEvents(client, { scope: new RequestScope(sessionId, 2), initialMeta: meta,
    refresh: async () => meta, random: () => 0, wait: async ms => { waits.push(ms); } });
  const sequence: number[] = [];
  for await (const e of watcher) { sequence.push(e.event_sequence); if (sequence.length === 3) break; }
  expect(sequence).toEqual([1, 2, 3]); expect(waits).toEqual([125]);
  expect(seen.some(url => url.endsWith("/stream?after=2"))).toBe(true);
});
test("SSE sequence gap catches up through filtered pages before applying event", async () => {
  let pages = 0;
  const client = new ApiClient({ baseUrl, credentials, fetch: async url => {
    if (url.includes("/stream")) return new Response(byteStream(eventFrame(4)), { headers: { "Content-Type": "text/event-stream" } });
    pages++;
    return response(pages === 1 ? { events: [], next_sequence: 0, has_more: false }
      : pages === 2 ? { events: [], next_sequence: 2, has_more: true }
      : { events: [event(3)], next_sequence: 3, has_more: false });
  } });
  const watcher = watchEvents(client, { scope: new RequestScope(sessionId, 2), initialMeta: meta, refresh: async () => meta });
  const sequences: number[] = [];
  for await (const e of watcher) { sequences.push(e.event_sequence); if (sequences.length === 2) break; }
  expect(sequences).toEqual([3, 4]); expect(pages).toBe(3);
});
test("expired cursor refreshes only caller-provided authorized view", async () => {
  let refreshed = 0, pages = 0; const cursors: number[] = [];
  const client = new ApiClient({ baseUrl, credentials, fetch: async url => {
    cursors.push(Number(new URL(url).searchParams.get("after")));
    if (++pages === 1) return errorResponse(410, "EVENT_CURSOR_EXPIRED");
    if (!url.includes("/stream")) return response({ events: [], next_sequence: 8, has_more: false });
    return new Response(byteStream(eventFrame(9)), { headers: { "Content-Type": "text/event-stream" } });
  } });
  for await (const e of watchEvents(client, { scope: new RequestScope(sessionId, 2), initialMeta: meta,
    refresh: async () => { refreshed++; return { ...meta, event_sequence: 8 }; }, wait: async () => undefined })) {
    expect(e.event_sequence).toBe(9); break;
  }
  expect(refreshed).toBe(1); expect(cursors).toEqual([0, 8, 8]);
});
test("caller aborts the subscription and no reconnect occurs", async () => {
  const scope = new RequestScope(sessionId, 2); let calls = 0;
  const client = new ApiClient({ baseUrl, credentials, fetch: async () => { calls++; return response({ events: [], next_sequence: 0, has_more: false }); } });
  scope.cancel(); const watcher = watchEvents(client, { scope, initialMeta: meta, refresh: async () => meta });
  await expect(watcher.next()).rejects.toBeInstanceOf(RequestCancelledError); expect(calls).toBe(0);
});
