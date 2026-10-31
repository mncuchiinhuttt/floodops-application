import type { TravelProfile } from "./graph-types.ts";

export function assertMilliseconds(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Expected nonnegative safe integer milliseconds.");
}

/** Continuous piecewise-linear duration, constant outside endpoint knots. */
export function validateTravelProfile(profile: TravelProfile): void {
  if (!profile.length) throw new Error("A travel profile must not be empty.");
  for (let i = 0; i < profile.length; i++) {
    const point = profile[i]!;
    assertMilliseconds(point.departureMs);
    assertMilliseconds(point.durationMs);
    assertMilliseconds(point.departureMs + point.durationMs);
    if (point.durationMs === 0) throw new Error("Travel duration must be positive.");
    const previous = profile[i - 1];
    if (previous && (point.departureMs <= previous.departureMs
      || point.departureMs + point.durationMs < previous.departureMs + previous.durationMs)) {
      throw new Error("Travel profile must have increasing departure knots and FIFO arrivals.");
    }
  }
}

function checkedDuration(departureMs: number, durationMs: number): number {
  assertMilliseconds(departureMs + durationMs);
  return durationMs;
}

export function travelDurationMs(profile: TravelProfile, departureMs: number): number {
  validateTravelProfile(profile);
  assertMilliseconds(departureMs);
  const first = profile[0]!;
  const last = profile[profile.length - 1]!;
  if (departureMs <= first.departureMs) return checkedDuration(departureMs, first.durationMs);
  for (let i = 1; i < profile.length; i++) {
    const right = profile[i]!;
    if (departureMs <= right.departureMs) {
      const left = profile[i - 1]!;
      // Exact rational ceiling of arrival avoids floating-point non-FIFO plateaus.
      const span = BigInt(right.departureMs) - BigInt(left.departureMs);
      const offset = BigInt(departureMs) - BigInt(left.departureMs);
      const leftArrival = BigInt(left.departureMs) + BigInt(left.durationMs);
      const arrivalRise = BigInt(right.departureMs) + BigInt(right.durationMs) - leftArrival;
      const arrival = leftArrival + (offset * arrivalRise + span - 1n) / span;
      return checkedDuration(departureMs, Number(arrival - BigInt(departureMs)));
    }
  }
  return checkedDuration(departureMs, last.durationMs);
}
