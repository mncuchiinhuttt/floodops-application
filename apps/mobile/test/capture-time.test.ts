import { captureTime } from "../src/features/reports/capture-time";

test("capture time uses scenario T0 plus fractional simulation minutes and rejects invalid inputs without wall time", () => {
  const wallClock = jest.spyOn(Date, "now").mockImplementation(() => { throw new Error("Wall time is not a capture source"); });
  try {
    const t0 = "2026-10-31T00:00:00Z";
    expect(captureTime(t0, 1.25)).toBe("2026-10-31T00:01:15.000Z");
    expect(captureTime("2026-10-31T07:00:00+07:00", 0.5)).toBe("2026-10-31T00:00:30.000Z");
    expect(captureTime(t0, 0)).toBe("2026-10-31T00:00:00.000Z");
    for (const minute of [-1, Number.NaN, Number.POSITIVE_INFINITY]) expect(() => captureTime(t0, minute)).toThrow();
    expect(() => captureTime("not-a-date", 1)).toThrow(/Scenario capture time unavailable/);
    expect(() => captureTime(t0, Number.MAX_VALUE)).toThrow(/Scenario capture time unavailable/);
    expect(wallClock).not.toHaveBeenCalled();
  } finally { wallClock.mockRestore(); }
});
