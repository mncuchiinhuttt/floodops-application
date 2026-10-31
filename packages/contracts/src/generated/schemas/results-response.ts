import { z } from "zod";
import { MetaSchema } from "./meta";
import { ResultsSchema } from "./results";

export const ResultsResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ResultsSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ResultsResponse = z.infer<typeof ResultsResponseSchema>;
