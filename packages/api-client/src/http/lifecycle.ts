import { RequestCancelledError, throwIfAborted } from "./errors";
import type { RequestOptions } from "./types";

export class RequestScope {
  readonly controller = new AbortController();
  constructor(readonly sessionId: string, readonly generation: number) {
    if (!Number.isSafeInteger(generation) || generation < 0) throw new RangeError("Invalid generation");
  }
  get signal(): AbortSignal { return this.controller.signal; }
  cancel(): void { this.controller.abort(); }
}
export class RequestTracker {
  private readonly sessions = new Map<string, Set<AbortController>>();
  begin(sessionId: string | undefined, options: RequestOptions) {
    const controller = new AbortController();
    const signals = [options.signal, options.scope?.signal].filter((s): s is AbortSignal => !!s);
    const abort = () => controller.abort();
    if (options.scope && options.scope.sessionId !== sessionId) throw new RequestCancelledError();
    for (const signal of signals) {
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    }
    if (sessionId) {
      const requests = this.sessions.get(sessionId) ?? new Set<AbortController>();
      requests.add(controller); this.sessions.set(sessionId, requests);
    }
    let released = false;
    return {
      signal: controller.signal,
      release: () => {
        if (released) return;
        released = true;
        signals.forEach(s => s.removeEventListener("abort", abort));
        if (sessionId) {
          const requests = this.sessions.get(sessionId);
          requests?.delete(controller);
          if (requests?.size === 0) this.sessions.delete(sessionId);
        }
      },
    };
  }
  cancelSession(sessionId: string): void {
    this.sessions.get(sessionId)?.forEach(controller => controller.abort());
  }
}
export function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  throwIfAborted(signal);
  return new Promise((resolve, reject) => {
    const abort = () => reject(new RequestCancelledError());
    signal.addEventListener("abort", abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}
export function scopedStream(stream: ReadableStream<Uint8Array>, signal: AbortSignal, release: () => void): ReadableStream<Uint8Array> {
  const reader = stream.getReader();
  let finished = false;
  let output: ReadableStreamDefaultController<Uint8Array>;
  const cleanup = () => { signal.removeEventListener("abort", abort); release(); };
  const abort = () => {
    if (finished) return;
    finished = true;
    output.error(new RequestCancelledError());
    void reader.cancel().catch(() => undefined).finally(() => { reader.releaseLock(); cleanup(); });
  };
  return new ReadableStream<Uint8Array>({
    start(controller) {
      output = controller;
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
    },
    async pull(controller) {
      if (finished) return;
      try {
        throwIfAborted(signal);
        const chunk = await reader.read();
        if (finished) return;
        if (chunk.done) { finished = true; controller.close(); reader.releaseLock(); cleanup(); }
        else controller.enqueue(chunk.value);
      } catch (error) {
        if (finished) return;
        finished = true; controller.error(error); reader.releaseLock(); cleanup();
      }
    },
    async cancel() {
      if (finished) return;
      finished = true;
      try { await reader.cancel(); } finally { reader.releaseLock(); cleanup(); }
    },
  });
}
