import { assertSimTimeMs } from "./simulation-time.ts";

export const EVENT_PHASES = Object.freeze({ input: 0, expiry: 1, invalidation: 2, entry: 3, completion: 4 });
export type EventPhase = keyof typeof EVENT_PHASES;
/** IDs refer to immutable data held by the caller; this queue never executes callbacks. */
export interface ScheduledEvent {
  readonly id: string;
  readonly atMs: number;
  readonly phase: EventPhase;
  readonly sequence: number;
}
export interface EventClock {
  readonly nowMs: number;
  readonly horizonMs: number;
  readonly pending: readonly ScheduledEvent[];
  readonly nextEventSequence: number;
}
export interface EmittedEvent { readonly event: ScheduledEvent; readonly eventSequence: number }
export interface ClockAdvance { readonly clock: EventClock; readonly emitted: readonly EmittedEvent[] }
const compareEvents = (a: ScheduledEvent, b: ScheduledEvent) => a.atMs - b.atMs
  || EVENT_PHASES[a.phase] - EVENT_PHASES[b.phase] || a.sequence - b.sequence;

export function createEventClock(nowMs: number, horizonMs: number, events: readonly ScheduledEvent[]): EventClock {
  assertSimTimeMs(nowMs);
  assertSimTimeMs(horizonMs);
  if (nowMs > horizonMs || (nowMs === horizonMs && events.length > 0)) {
    throw new Error("Clock starts after horizon or has undrainable events at H.");
  }
  const ids = new Set<string>();
  const sequences = new Set<number>();
  const pending = events.map(event => {
    assertSimTimeMs(event.atMs);
    assertSimTimeMs(event.sequence);
    if (!event.id.trim() || ids.has(event.id) || sequences.has(event.sequence)
      || !Object.hasOwn(EVENT_PHASES, event.phase) || event.atMs < nowMs || event.atMs > horizonMs) {
      throw new Error("Invalid, duplicate or out-of-horizon event.");
    }
    ids.add(event.id);
    sequences.add(event.sequence);
    return Object.freeze({ id: event.id, atMs: event.atMs, phase: event.phase, sequence: event.sequence });
  }).sort(compareEvents);
  return Object.freeze({ nowMs, horizonMs, pending: Object.freeze(pending), nextEventSequence: 1 });
}

/** Drain every boundary through target, inclusive. Caller applies emitted events in order. */
export function advanceEventClock(clock: EventClock, targetMs: number): ClockAdvance {
  assertSimTimeMs(targetMs);
  if (targetMs <= clock.nowMs || targetMs > clock.horizonMs) throw new Error("Advance must increase time within H.");
  const split = clock.pending.findIndex(event => event.atMs > targetMs);
  const count = split === -1 ? clock.pending.length : split;
  assertSimTimeMs(clock.nextEventSequence + count);
  const emitted = clock.pending.slice(0, count).map((event, index) => Object.freeze({ event,
    eventSequence: clock.nextEventSequence + index }));
  return Object.freeze({ clock: Object.freeze({ ...clock, nowMs: targetMs,
    pending: Object.freeze(clock.pending.slice(count)), nextEventSequence: clock.nextEventSequence + count }),
  emitted: Object.freeze(emitted) });
}
