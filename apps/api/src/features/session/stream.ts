import { parseSchema, type EventPage } from "@floodops/contracts";
import { randomId } from "../../shared/crypto";
import { fail } from "../../shared/platform-error";
import type { AppContext, Reply } from "../../shared/platform-types";
import { invoke, runtimeCall, send } from "../../app/http";
export async function streamEvents(c: AppContext): Promise<Response> {
  const query = c.req.query();
  if (query.after === undefined || !Object.keys(query).every(k => k === "after")) fail(422, "INVALID_SCHEMA");
  const after = Number(c.req.header("Last-Event-ID") ?? query.after);
  parseSchema("CursorFrame", { next_sequence: after });
  const streamId = randomId("stream");
  const call = runtimeCall(c, "stream-open", { after, limit: 500, streamId });
  const initial = await invoke(c, call);
  if (initial.status !== 200) return send(c, initial);
  let cursor = after; let closed = false; let busy = false;
  let poll: ReturnType<typeof setInterval> | undefined;
  let lifetime: ReturnType<typeof setTimeout> | undefined;
  let controller: ReadableStreamDefaultController<Uint8Array>;
  let heartbeatAt = Date.now();
  const encoder = new TextEncoder();
  const release = async () => { await invoke(c, { ...call, kind: "stream-close" }); };
  const close = () => {
    if (closed) return; closed = true;
    clearInterval(poll); clearTimeout(lifetime);
    c.req.raw.signal.removeEventListener("abort", close);
    try { controller.close(); } catch { /* Reader cancellation already closed it. */ }
    c.executionCtx.waitUntil(release());
  };
  function emit(reply: Reply): void {
    const page = parseSchema("EventPage", reply.body.data) as EventPage;
    for (const event of page.events) controller.enqueue(encoder.encode(`id: ${event.event_sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
    if (page.next_sequence > cursor) controller.enqueue(encoder.encode(`event: cursor\ndata: ${JSON.stringify({ next_sequence: page.next_sequence })}\n\n`));
    cursor = page.next_sequence;
  }
  const body = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value; emit(initial);
      poll = setInterval(() => {
        if (busy || closed) return; busy = true;
        void (async () => {
          try {
            const next = await invoke(c, { ...call, kind: "stream-poll", after: cursor });
            if (closed) return;
            if (next.status !== 200) { close(); return; }
            // Apply backpressure by reconnecting from the last cursor instead of buffering indefinitely.
            if ((controller.desiredSize ?? 0) < -500) { close(); return; }
            emit(next);
            if (Date.now() - heartbeatAt >= 15000) { controller.enqueue(encoder.encode(": heartbeat\n\n")); heartbeatAt = Date.now(); }
          } catch { close(); } finally { busy = false; }
        })();
      }, 1000);
      lifetime = setTimeout(close, 60000);
      c.req.raw.signal.addEventListener("abort", close, { once: true });
      if (c.req.raw.signal.aborted) close();
    },
    cancel() { close(); },
  });
  return new Response(body, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", "X-Accel-Buffering": "no", "X-Request-ID": c.get("requestId") } });
}
