import { describe, expect, test } from "bun:test";
import { distanceMeters, polylineLengthMeters, travelDurationMs, validateTravelProfile } from "../../src/graph/index.ts";
import { bentGeometry } from "./graph-builder.ts";

describe("synthetic spherical WGS84 geometry", () => {
  test("uses all vertices and meters, handles the antimeridian", () => {
    expect(distanceMeters([0, 0], [0, 1])).toBeCloseTo(111195.0802, 3);
    const length = polylineLengthMeters(bentGeometry());
    expect(length).toBeGreaterThan(distanceMeters([0, 0], [1, 1]));
    expect(length).toBeCloseTo(distanceMeters([0, 0], [0, 1]) + distanceMeters([0, 1], [1, 1]), 6);
    expect(distanceMeters([179.9, 0], [-179.9, 0])).toBeCloseTo(22239.016, 2);
    expect(distanceMeters([0, 0], [180, 0])).toBeCloseTo(Math.PI * 6371008.8, 5);
  });
  test("rejects malformed/nonfinite/out-of-range coordinates and short polylines", () => {
    for (const point of [[181, 0], [0, 91], [NaN, 0], [0, Infinity]] as const) {
      expect(() => distanceMeters(point, [0, 0])).toThrow();
    }
    expect(() => polylineLengthMeters([[0, 0]])).toThrow();
  });
});

describe("piecewise-linear FIFO travel", () => {
  test("interpolates, clamps endpoints and rounds durations up to integer ms", () => {
    const profile = [{ departureMs: 10, durationMs: 20 }, { departureMs: 20, durationMs: 15 }];
    expect(travelDurationMs(profile, 0)).toBe(20);
    expect(travelDurationMs(profile, 10)).toBe(20);
    expect(travelDurationMs(profile, 11)).toBe(20);
    expect(travelDurationMs(profile, 15)).toBe(18);
    expect(travelDurationMs(profile, 20)).toBe(15);
    expect(travelDurationMs(profile, 21)).toBe(15);
  });
  test("allows falling duration while rejecting decreasing arrivals or invalid knots", () => {
    expect(() => validateTravelProfile([{ departureMs: 0, durationMs: 20 },
      { departureMs: 10, durationMs: 10 }])).not.toThrow();
    const invalid = [[], [{ departureMs: 0, durationMs: 0 }], [{ departureMs: -1, durationMs: 1 }],
      [{ departureMs: 0, durationMs: NaN }], [{ departureMs: 1.5, durationMs: 1 }],
      [{ departureMs: 0, durationMs: 20 }, { departureMs: 10, durationMs: 9 }],
      [{ departureMs: 10, durationMs: 1 }, { departureMs: 10, durationMs: 2 }],
      [{ departureMs: Number.MAX_SAFE_INTEGER, durationMs: 1 }]];
    for (const profile of invalid) expect(() => validateTravelProfile(profile)).toThrow();
    expect(() => travelDurationMs([{ departureMs: 0, durationMs: 1 }], Infinity)).toThrow();
  });
  test("all sampled FIFO arrival times remain monotone across each segment", () => {
    for (let endDuration = 10; endDuration <= 40; endDuration++) {
      const profile = [{ departureMs: 0, durationMs: 30 }, { departureMs: 20, durationMs: endDuration }];
      let previousArrival = -1;
      for (let departure = 0; departure <= 40; departure++) {
        const arrival = departure + travelDurationMs(profile, departure);
        expect(arrival).toBeGreaterThanOrEqual(previousArrival);
        previousArrival = arrival;
      }
    }
  });
});

test("exact integer interpolation preserves every constant-arrival plateau", () => {
  for (let span = 1; span <= 80; span++) {
    const profile = [{ departureMs: 0, durationMs: span + 1 }, { departureMs: span, durationMs: 1 }];
    for (let departure = 0; departure <= span; departure++) {
      expect(departure + travelDurationMs(profile, departure)).toBe(span + 1);
    }
  }
  const base = Number.MAX_SAFE_INTEGER - 1000;
  const profile = [{ departureMs: base, durationMs: 23 }, { departureMs: base + 22, durationMs: 1 }];
  for (let offset = 0; offset <= 22; offset++) {
    expect(base + offset + travelDurationMs(profile, base + offset)).toBe(base + 23);
  }
  expect(() => travelDurationMs([{ departureMs: 0, durationMs: 1 }], Number.MAX_SAFE_INTEGER)).toThrow();
});
