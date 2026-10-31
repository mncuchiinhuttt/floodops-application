import { z } from "zod";
import { hasUniqueItems, isTimestamp } from "../../schema-helpers";
import { ProvenanceSchema } from "./provenance";
import { VehicleTypeSchema } from "./vehicle-type";

export const ParameterSchema = z.strictObject({
  "key": z.string().refine(v => [...v].length <= 100, "String too long"),
  "value": z.union([z.number().finite(), z.null()]),
  "unit": z.string().refine(v => [...v].length <= 80, "String too long"),
  "basis": z.literal(["measured","derived","assumed","missing"]),
  "vehicle_types": z.array(VehicleTypeSchema).refine(hasUniqueItems, "Duplicate items"),
  "geography": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "valid_from": z.union([z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"), z.null()]),
  "valid_until": z.union([z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"), z.null()]),
  "sample_size": z.union([z.number().finite().refine(Number.isInteger, "Expected integer").min(0), z.null()]),
  "tolerance": z.union([z.number().finite().min(0), z.null()]),
  "uncertainty": z.union([z.string().refine(v => [...v].length <= 2000, "String too long"), z.null()]),
  "provenance": z.array(ProvenanceSchema),
});
export type Parameter = z.infer<typeof ParameterSchema>;
