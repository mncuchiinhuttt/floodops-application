import { ContractValidationError, type Event, type Meta } from "@floodops/contracts";
import type { ApiClient } from "../client";
import { ApiError, TransportError, throwIfAborted } from "../http/errors";
import { RequestScope } from "../http/lifecycle";
import { canRetry, waitForRetry } from "../http/retry";
import { cursorFromSnapshot, EventSequenceGap } from "./event-cursor";
import { parseSse } from "./sse-parser";

export interface WatchEventsOptions {
  scope: RequestScope;
  initialMeta: Meta;
  /** Refresh the current role's authorized view; never assume full snapshot access. */
  refresh: (signal: AbortSignal) => Promise<Meta>;
  maxReconnects?: number;
  maxCatchupPages?: number;
  wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
  random?: () => number;
}
/** Bounded foreground subscription; caller cancels scope on background/unmount/reset. */
export async function* watchEvents(client: ApiClient, options: WatchEventsOptions): AsyncGenerator<Event> {
  const { scope } = options;
  const maxReconnects = options.maxReconnects ?? 3, maxPages = options.maxCatchupPages ?? 100;
  if (!Number.isInteger(maxReconnects) || maxReconnects < 0 || maxReconnects > 10 ||
    !Number.isInteger(maxPages) || maxPages < 1 || maxPages > 100) throw new RangeError("Invalid subscription bounds");
  let cursor = cursorFromSnapshot(options.initialMeta, scope.sessionId, scope.generation);
  const path = { session_id: scope.sessionId };
  async function* catchup(): AsyncGenerator<Event> {
    for (let page = 0; page < maxPages; page++) {
      const previous = cursor.after;
      const result = await client.request("getEvents", { path, query: { after: previous, limit: 500 } }, { scope });
      const events = cursor.applyPage(result.body.data);
      if (result.body.data.has_more && cursor.after <= previous) {
        throw new ContractValidationError("events", [{ path: "next_sequence", code: "no_cursor_progress" }]);
      }
      yield* events;
      if (!result.body.data.has_more) return;
    }
    throw new ContractValidationError("events", [{ path: "pages", code: "catchup_limit" }]);
  }
  let streamRetry = 0;
  for (let reconnect = 0; ; reconnect++) {
    throwIfAborted(scope.signal);
    try {
      yield* catchup();
      const result = await client.request("streamEvents", { path, query: { after: cursor.after } }, { scope });
      for await (const frame of parseSse(result.body, scope.signal)) {
        if (frame.retry !== null) streamRetry = frame.retry;
        let event: Event | null;
        try { event = cursor.applyFrame(frame); } catch (error) {
          if (!(error instanceof EventSequenceGap)) throw error;
          yield* catchup();
          event = cursor.applyFrame(frame);
        }
        if (event) yield event;
      }
      throw new TransportError();
    } catch (error) {
      throwIfAborted(scope.signal);
      if (reconnect >= maxReconnects) throw error;
      if (error instanceof ApiError && error.response.error.code === "EVENT_CURSOR_EXPIRED") {
        cursor = cursorFromSnapshot(await options.refresh(scope.signal), scope.sessionId, scope.generation);
      } else if (!canRetry(error)) throw error;
      const jitter = (options.random ?? Math.random)();
      if (!Number.isFinite(jitter) || jitter < 0 || jitter > 1) throw new RangeError("Invalid reconnect jitter", { cause: error });
      const serverDelay = error instanceof ApiError ? error.retryAfterMs ?? 0 : 0;
      if (serverDelay > 30_000) throw error;
      await (options.wait ?? waitForRetry)(Math.max(serverDelay, streamRetry, Math.min(30_000, 250 * 2 ** reconnect * (0.5 + jitter / 2))), scope.signal);
    }
  }
}
