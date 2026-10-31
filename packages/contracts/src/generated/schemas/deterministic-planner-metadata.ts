import { z } from "zod";

export const DeterministicPlannerMetadataSchema = z.strictObject({
  "kind": z.literal("deterministic"),
  "algorithm_version": z.string().refine(v => [...v].length >= 1, "String too short").refine(v => [...v].length <= 80, "String too long"),
  "config_hash": z.string().regex(new RegExp("^[0-9a-f]{64}$")),
  "search_limit": z.number().finite().refine(Number.isInteger, "Expected integer").min(1).max(9007199254740991),
}).describe("Server-declared bounded candidate-evaluation budget and frozen configuration. Stable tie-break IDs, no LLM/tool selection and no claim of global optimum. Limit is supplied explicitly; no default numeric policy.");
export type DeterministicPlannerMetadata = z.infer<typeof DeterministicPlannerMetadataSchema>;
