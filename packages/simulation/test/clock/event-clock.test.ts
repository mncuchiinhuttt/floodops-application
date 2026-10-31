import { expect, test } from "bun:test";
import { advanceEventClock, createEventClock, millisecondsToMinutes, minutesToMilliseconds } from "../../src/clock/index.ts";
import type { ScheduledEvent } from "../../src/clock/index.ts";

const events: readonly ScheduledEvent[] = [
  { id: "complete", atMs: 10, phase: "completion", sequence: 0 },
  { id: "entry", atMs: 10, phase: "entry", sequence: 1 },
  { id: "invalidate", atMs: 10, phase: "invalidation", sequence: 2 },
  { id: "expiry", atMs: 10, phase: "expiry", sequence: 3 },
  { id: "closure", atMs: 10, phase: "input", sequence: 4 },
  { id: "evidence", atMs: 10, phase: "input", sequence: 5 },
  { id: "early", atMs: 0, phase: "input", sequence: 6 },
  { id: "later", atMs: 15, phase: "input", sequence: 7 }
];

test("integer clock conversion is explicit and rejects invalid time", () => {
  expect(minutesToMilliseconds(0.125)).toBe(7500);
  expect(minutesToMilliseconds(1 / 180000)).toBe(0);
  expect(millisecondsToMinutes(7500)).toBe(0.125);
  for (const value of [-1, Infinity, NaN, Number.MAX_VALUE]) expect(() => minutesToMilliseconds(value)).toThrow();
  for (const value of [-1, 0.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) expect(() => millisecondsToMinutes(value)).toThrow();
});

test("every boundary is emitted inclusively; closure/expiry precede entry at equal time", () => {
  const initial = createEventClock(0, 20, events);
  const advance = advanceEventClock(initial, 10);
  expect(advance.emitted.map(item => item.event.id)).toEqual(["early", "closure", "evidence", "expiry", "invalidate", "entry", "complete"]);
  expect(advance.emitted.map(item => item.eventSequence)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  expect(advance.clock.nowMs).toBe(10);
  expect(advance.clock.pending.map(event => event.id)).toEqual(["later"]);
  expect(initial.nowMs).toBe(0);
  const state = { closed: false, current: true, entered: false };
  for (const { event } of advance.emitted) {
    if (event.id === "closure") state.closed = true;
    if (event.id === "expiry") state.current = false;
    if (event.id === "entry") state.entered = !state.closed && state.current;
  }
  expect(state.entered).toBe(false);
});

test("independent branches and split advances reproduce the same ordered trace", () => {
  const a = createEventClock(0, 20, events), b = createEventClock(0, 20, [...events].reverse());
  const first = advanceEventClock(a, 5), second = advanceEventClock(first.clock, 10), third = advanceEventClock(second.clock, 20);
  const whole = advanceEventClock(b, 20);
  expect([...first.emitted, ...second.emitted, ...third.emitted]).toEqual([...whole.emitted]);
  expect(third.clock).toEqual(whole.clock);
  expect(b.nowMs).toBe(0);
  expect(a.pending).toHaveLength(8);
  expect(Object.isFrozen(a.pending[0])).toBe(true);
  expect(() => advanceEventClock(third.clock, 21)).toThrow();
});

test("rejects duplicate identifiers/sequences, invalid phase and out-of-range events/targets", () => {
  const one = events[0]!;
  for (const invalid of [[one, one], [one, { ...one, id: "other" }], [{ ...one, atMs: 21 }],
    [{ ...one, atMs: -1 }], [{ ...one, sequence: 0.5 }], [{ ...one, id: "" }]]) {
    expect(() => createEventClock(0, 20, invalid)).toThrow();
  }
  expect(() => createEventClock(1, 20, [{ ...one, atMs: 0 }])).toThrow();
  expect(() => createEventClock(21, 20, [])).toThrow();
  expect(() => createEventClock(20, 20, [{ ...one, atMs: 20 }])).toThrow();
  expect(createEventClock(20, 20, []).pending).toEqual([]);
  const invalidPhase = { ...one, phase: "toString" } as unknown as ScheduledEvent;
  expect(() => createEventClock(0, 20, [invalidPhase])).toThrow();
  const clock = createEventClock(0, 20, []);
  for (const target of [0, -1, 21, 1.5, Infinity]) expect(() => advanceEventClock(clock, target)).toThrow();
});

test("clock snapshots detach mutable event inputs and retain events at horizon", () => {
  const input = [{ id: "end", atMs: 20, phase: "input" as const, sequence: 1 }];
  const clock = createEventClock(0, 20, input);
  input[0]!.atMs = 1;
  expect(advanceEventClock(clock, 20).emitted[0]!.event.atMs).toBe(20);
});
