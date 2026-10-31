import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { CoordinateSchema } from "./coordinate";

export const MeasurementSchema = z.strictObject({
  "measurement_type": z.literal(["rain","tide_height","river_level","discharge","street_depth"]),
  "value": z.number().finite(),
  "unit": z.string().refine(v => [...v].length <= 40, "String too long"),
  "datum": z.union([z.string().refine(v => [...v].length <= 100, "String too long"), z.null()]),
  "coordinate": z.union([CoordinateSchema, z.null()]),
  "station_id": z.union([z.string().refine(v => [...v].length <= 128, "String too long"), z.null()]),
  "is_forecast": z.boolean(),
  "issued_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "observed_at": z.union([z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"), z.null()]),
  "valid_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
});
export type Measurement = z.infer<typeof MeasurementSchema>;
