import type { TravelProfile, TravelPoint, TravelWindow } from "./graph-types.ts";

export function assertMilliseconds(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Expected nonnegative safe integer milliseconds.");
}

/** Continuous piecewise-linear duration, constant outside endpoint knots. */
export function isWindowProfile(profile: TravelProfile): profile is readonly TravelWindow[] {
  return Boolean(profile.length && "validFromMs" in profile[0]!);
}
export function isTravelTimeAvailable(profile: TravelProfile, departureMs: number): boolean {
  assertMilliseconds(departureMs);
  return !isWindowProfile(profile) || profile.some(window => departureMs >= window.validFromMs
    && (window.validUntilMs === null || departureMs < window.validUntilMs));
}
export function validateTravelProfile(profile: TravelProfile): void {
  if (isWindowProfile(profile)) { validateWindows(profile); return; }
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
  if (isWindowProfile(profile)) {
    const window = profile.find(item => departureMs >= item.validFromMs
      && (item.validUntilMs === null || departureMs < item.validUntilMs));
    if (!window) throw new Error("Travel profile unavailable at entry time.");
    return checkedDuration(departureMs, window.durationMs);
  }
  const points = profile as readonly TravelPoint[];
  const first = points[0]!;
  const last = points[points.length - 1]!;
  if (departureMs <= first.departureMs) return checkedDuration(departureMs, first.durationMs);
  for (let i = 1; i < profile.length; i++) {
    const right = points[i]!;
    if (departureMs <= right.departureMs) {
      const left = points[i - 1]!;
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

function validateWindows(profile: readonly TravelWindow[]): void {
  for (let i = 0; i < profile.length; i++) {
    const window = profile[i]!;
    assertMilliseconds(window.validFromMs); assertMilliseconds(window.durationMs);
    if (!window.durationMs || (i === 0 && window.validFromMs !== 0)) throw new Error("Window profiles must start at0 with positive duration.");
    if (window.validUntilMs !== null) {
      assertMilliseconds(window.validUntilMs);
      if (window.validUntilMs <= window.validFromMs) throw new Error("Empty/reversed travel window.");
      assertMilliseconds(window.validUntilMs + window.durationMs);
    }
    const previous = profile[i - 1];
    if (previous && (previous.validUntilMs !== window.validFromMs || window.durationMs < previous.durationMs)) {
      throw new Error("Window profiles need contiguous coverage and FIFO transitions.");
    }
  }
}
