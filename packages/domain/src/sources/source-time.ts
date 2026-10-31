import { MeasurementSchema, TimestampSchema } from "@floodops/contracts";
import { fail } from "./source-types.ts";

export function simTimestamp(t0: string, minute: number): string {
  if (!TimestampSchema.safeParse(t0).success) fail("INVALID_TIME");
  const time = Date.parse(t0) + Math.round(minute * 60_000);
  if (!Number.isFinite(minute) || minute < 0 || !Number.isFinite(time)) fail("INVALID_TIME");
  return new Date(time).toISOString();
}
export function assertMappedTime(t0: string, timestamp: string, minute: number): void {
  if (Date.parse(timestamp) !== Date.parse(simTimestamp(t0, minute))) fail("INVALID_TIME");
}
export function assertClock(t0: string, now: number): void { simTimestamp(t0, now); }

/** Only dimension-preserving conversions; elevation datum is retained, never inferred. */
export function normalizeMeasurement(raw: unknown) {
  const parsed = MeasurementSchema.safeParse(raw);
  if (!parsed.success) fail("INVALID_SCHEMA");
  const measurement = parsed.data;
  const units: Record<string, readonly [string, number][]> = {
    rain: [["mm", 1], ["cm", 10], ["m", 1000]],
    tide_height: [["m", 1], ["cm", 0.01], ["mm", 0.001]],
    river_level: [["m", 1], ["cm", 0.01], ["mm", 0.001]],
    street_depth: [["m", 1], ["cm", 0.01], ["mm", 0.001]],
    discharge: [["m3/s", 1], ["m³/s", 1], ["L/s", 0.001]]
  };
  const unit = units[measurement.measurement_type]!.find(([name]) => name === measurement.unit);
  if (!unit) fail("UNSUPPORTED_UNIT");
  const value = measurement.value * unit[1];
  if (!Number.isFinite(value) || ((measurement.measurement_type === "rain" || measurement.measurement_type === "street_depth") && value < 0)) fail("INVALID_SCHEMA");
  if (measurement.coordinate === null && measurement.station_id === null) fail("NEEDS_CLARIFICATION");
  if (!measurement.is_forecast && measurement.observed_at === null) fail("INVALID_TIME");
  return { ...measurement, value, unit: units[measurement.measurement_type]![0]![0],
    issued_at: new Date(measurement.issued_at).toISOString(),
    observed_at: measurement.observed_at === null ? null : new Date(measurement.observed_at).toISOString(),
    valid_at: new Date(measurement.valid_at).toISOString() };
}
