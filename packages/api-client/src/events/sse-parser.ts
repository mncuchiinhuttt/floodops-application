import { ContractValidationError } from "@floodops/contracts";
import { abortable } from "../http/lifecycle";
import { throwIfAborted, TransportError } from "../http/errors";

export interface SseFrame { event: string; data: string; id: string; retry: number | null }
function invalid(): never {
  throw new ContractValidationError("SSE", [{ path: "frame", code: "invalid_or_oversized_frame" }]);
}
/** Incremental UTF-8 and CR/LF framing, including comments and multiline data. */
export async function* parseSse(
  stream: ReadableStream<Uint8Array>, signal: AbortSignal = new AbortController().signal,
  maxFrameSize = 1_048_576,
): AsyncGenerator<SseFrame> {
  if (!Number.isSafeInteger(maxFrameSize) || maxFrameSize < 1) throw new RangeError("Invalid frame limit");
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let buffer = "", event = "", id = "", data: string[] = [], size = 0;
  let retry: number | null = null;
  function line(value: string): SseFrame | null {
    size += value.length;
    if (size > maxFrameSize) invalid();
    if (value === "") {
      const frame = data.length ? { event: event || "message", data: data.join("\n"), id, retry } : null;
      event = ""; data = []; size = 0;
      return frame;
    }
    if (value.startsWith(":")) return null;
    const colon = value.indexOf(":");
    const field = colon < 0 ? value : value.slice(0, colon);
    let content = colon < 0 ? "" : value.slice(colon + 1);
    if (content.startsWith(" ")) content = content.slice(1);
    if (field === "data") data.push(content);
    else if (field === "event") event = content;
    else if (field === "id" && !content.includes("\0")) id = content;
    else if (field === "retry" && /^[0-9]+$/.test(content)) retry = Math.min(Number(content), 30_000);
    return null;
  }
  try {
    for (;;) {
      throwIfAborted(signal);
      let chunk: Awaited<ReturnType<typeof reader.read>>;
      try { chunk = await abortable(reader.read(), signal); } catch {
        throwIfAborted(signal); throw new TransportError();
      }
      try { buffer += decoder.decode(chunk.value, { stream: !chunk.done }); } catch { invalid(); }
      for (;;) {
        const index = buffer.search(/[\r\n]/);
        if (index < 0 || (!chunk.done && buffer[index] === "\r" && index === buffer.length - 1)) break;
        const value = buffer.slice(0, index);
        const end = index + (buffer[index] === "\r" && buffer[index + 1] === "\n" ? 2 : 1);
        buffer = buffer.slice(end);
        const frame = line(value);
        if (frame) yield frame;
      }
      if (buffer.length + size > maxFrameSize) invalid();
      if (chunk.done) break; // Undelimited final data is never dispatched.
    }
  } finally {
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
