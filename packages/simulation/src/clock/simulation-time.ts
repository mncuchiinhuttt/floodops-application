/** Internal time is nonnegative integer milliseconds from the scenario T0. */
export function assertSimTimeMs(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid simulation milliseconds.");
}

/** Round API minutes to the nearest millisecond once at the integration boundary. */
export function minutesToMilliseconds(minutes: number): number {
  if (!Number.isFinite(minutes) || minutes < 0) throw new Error("Invalid simulation minutes.");
  const milliseconds = Math.round(minutes * 60_000);
  assertSimTimeMs(milliseconds);
  return milliseconds;
}

export function millisecondsToMinutes(milliseconds: number): number {
  assertSimTimeMs(milliseconds);
  return milliseconds / 60_000;
}
