import { ContractValidationError, CursorFrameSchema, EventSchema, EventPageSchema, MetaSchema,
  validate, type Event, type EventPage, type Meta } from "@floodops/contracts";
import type { SseFrame } from "./sse-parser";

function invalid(code: string): never {
  throw new ContractValidationError("events", [{ path: "cursor/scope", code }]);
}
export class EventSequenceGap extends Error {
  override readonly name = "EventSequenceGap";
}
export class EventCursor {
  private sequence: number;
  constructor(readonly sessionId: string, readonly generation: number, after: number) {
    if (![generation, after].every(n => Number.isSafeInteger(n) && n >= 0)) invalid("invalid_sequence");
    this.sequence = after;
  }
  get after(): number { return this.sequence; }
  private check(event: Event): void {
    if (event.session_id !== this.sessionId || event.generation !== this.generation) invalid("session_generation_mismatch");
    if (!Number.isSafeInteger(event.event_sequence)) invalid("invalid_sequence");
  }
  applyPage(value: EventPage): Event[] {
    const page = validate(EventPageSchema, value, "events.page");
    if (!Number.isSafeInteger(page.next_sequence) || page.next_sequence < this.sequence) invalid("cursor_regression");
    let previous = this.sequence;
    const output: Event[] = [];
    for (const event of page.events) {
      this.check(event);
      if (event.event_sequence <= this.sequence) continue;
      if (event.event_sequence <= previous || event.event_sequence > page.next_sequence) invalid("invalid_page_order");
      previous = event.event_sequence; output.push(event);
    }
    this.sequence = page.next_sequence; // Empty pages can advance over filtered events.
    return output;
  }
  applyFrame(frame: SseFrame): Event | null {
    let value: unknown;
    try { value = JSON.parse(frame.data); } catch { return invalid("invalid_frame_json"); }
    if (frame.event === "cursor") {
      const { next_sequence } = validate(CursorFrameSchema, value, "events.cursor");
      if (!Number.isSafeInteger(next_sequence)) invalid("invalid_sequence");
      this.sequence = Math.max(this.sequence, next_sequence);
      return null;
    }
    const event = validate(EventSchema, value, "events.event");
    this.check(event);
    if (frame.event !== "message" && frame.event !== event.type) invalid("event_type_mismatch");
    if (frame.id !== String(event.event_sequence)) invalid("event_id_mismatch");
    if (event.event_sequence <= this.sequence) return null;
    if (event.event_sequence !== this.sequence + 1) throw new EventSequenceGap();
    this.sequence = event.event_sequence;
    return event;
  }
}
/** Caller loads its capability-authorized snapshot or own dashboard before subscribing. */
export function cursorFromSnapshot(meta: Meta, sessionId: string, generation: number): EventCursor {
  const parsed = validate(MetaSchema, meta, "events.snapshot");
  if (parsed.session_id !== sessionId || parsed.generation !== generation || parsed.event_sequence === undefined) {
    invalid("snapshot_scope_mismatch");
  }
  return new EventCursor(sessionId, generation, parsed.event_sequence);
}
