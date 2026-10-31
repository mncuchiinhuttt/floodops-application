import { z } from "zod";
import { isTimestamp, isUri } from "../../schema-helpers";
import { ProvenanceLabelSchema } from "./provenance-label";

export const ProvenanceSchema = z.strictObject({
  "label": ProvenanceLabelSchema,
  "reference_url": z.union([z.string().refine(v => [...v].length <= 2048, "String too long").refine(isUri, "Invalid absolute URI"), z.null()]),
  "source_date": z.union([z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"), z.null()]),
  "licence": z.string().refine(v => [...v].length <= 200, "String too long"),
  "method": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "source_hash": z.string().refine(v => [...v].length <= 128, "String too long"),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;
