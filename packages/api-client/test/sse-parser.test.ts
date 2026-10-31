import { expect, test } from "bun:test";
import { ContractValidationError } from "@floodops/contracts";
import { parseSse, EventCursor, EventSequenceGap, cursorFromSnapshot, RequestCancelledError, TransportError } from "../src";
import { byteStream, event, eventFrame, meta, sessionId } from "./fixtures";
async function collect<T>(source: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = []; for await (const item of source) result.push(item); return result;
}
test("UTF-8 byte splits, CRLF/CR/LF, comments, multiline data, retry and persistent ID", async () => {
  const text = '\uFEFF: heartbeat\r\nid: 1\r\nevent: note\r\nretry: 400\r\ndata: mưa\r\ndata: đường\r\n\r\nevent: cursor\ndata: {"next_sequence":3}\n\n';
  for (const size of [1, 2, 7, 1000]) {
    const frames = await collect(parseSse(byteStream(text, size)));
    expect(frames).toEqual([
      { id: "1", event: "note", retry: 400, data: "mưa\nđường" },
      { id: "1", event: "cursor", retry: 400, data: '{"next_sequence":3}' },
    ]);
  }
  expect(await collect(parseSse(byteStream("data: incomplete")))).toEqual([]);
  expect(await collect(parseSse(byteStream("data: complete\r\r")))).toHaveLength(1);
});
test("malformed UTF8, oversized frames and body network failures stay distinct", async () => {
  const invalid = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new Uint8Array([0xff])); c.close(); } });
  await expect(collect(parseSse(invalid))).rejects.toBeInstanceOf(ContractValidationError);
  await expect(collect(parseSse(byteStream("data: too-large\n\n"), undefined, 8))).rejects.toBeInstanceOf(ContractValidationError);
  const network = new ReadableStream<Uint8Array>({ start(c) { c.error(new TypeError("network interruption")); } });
  await expect(collect(parseSse(network))).rejects.toBeInstanceOf(TransportError);
});
test("abort pending reader cancels upstream and releases its lock", async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
  const abort = new AbortController();
  const iterator = parseSse(stream, abort.signal);
  const next = iterator.next(); abort.abort();
  await expect(next).rejects.toBeInstanceOf(RequestCancelledError);
  expect(cancelled).toBe(true); expect(stream.locked).toBe(false);
});
test("event/cursor projection handles duplicates, filtered gaps and unchanged revision", async () => {
  const cursor = cursorFromSnapshot(meta, sessionId, 2);
  const frames = await collect(parseSse(byteStream(eventFrame(1) + 'event: cursor\ndata: {"next_sequence":3}\n\n' + eventFrame(4))));
  expect(cursor.applyFrame(frames[0]!)).toEqual(event(1));
  expect(cursor.applyFrame(frames[0]!)).toBeNull();
  expect(cursor.applyFrame(frames[1]!)).toBeNull();
  expect(cursor.after).toBe(3);
  expect(cursor.applyFrame(frames[2]!)?.revision).toBe(3); expect(cursor.after).toBe(4);
  expect(() => new EventCursor(sessionId, 2, 0).applyFrame(frames[2]!)).toThrow(EventSequenceGap);
});
test("catch-up commits only valid ordered pages and advances hidden-only pages", () => {
  const cursor = new EventCursor(sessionId, 2, 0);
  expect(cursor.applyPage({ events: [], next_sequence: 2, has_more: true })).toEqual([]);
  expect(cursor.applyPage({ events: [event(4), event(6)], next_sequence: 7, has_more: false })).toHaveLength(2);
  expect(cursor.after).toBe(7);
  for (const page of [
    { events: [event(8), event(9, { generation: 3 })], next_sequence: 9, has_more: false },
    { events: [event(9), event(8)], next_sequence: 9, has_more: false },
    { events: [], next_sequence: 6, has_more: false },
  ]) {
    expect(() => cursor.applyPage(page)).toThrow(ContractValidationError); expect(cursor.after).toBe(7);
  }
  expect(() => cursorFromSnapshot({ ...meta, generation: 1 }, sessionId, 2)).toThrow();
  expect(() => cursor.applyFrame({ event: "message", id: "8", retry: null,
    data: JSON.stringify(event(8, { session_id: "session_wrong001" })) })).toThrow();
});
