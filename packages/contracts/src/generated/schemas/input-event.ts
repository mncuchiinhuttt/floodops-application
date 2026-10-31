import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { IdSchema } from "./id";
import { MeasurementSchema } from "./measurement";
import { ProvenanceLabelSchema } from "./provenance-label";

export const InputEventSchema = z.strictObject({
  "input_event_id": IdSchema,
  "source_id": IdSchema,
  "fixture_event_id": IdSchema,
  "role": z.literal(["context","observation","restriction"]),
  "observed_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "received_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "label": ProvenanceLabelSchema,
  "measurement": z.union([MeasurementSchema, z.null()]),
  "restriction_id": z.union([IdSchema, z.null()]),
  "report_id": z.union([IdSchema, z.null()]),
});
export type InputEvent = z.infer<typeof InputEventSchema>;
