import { z } from "zod";
import { IdSchema } from "./id";
import { ProvenanceSchema } from "./provenance";

export const SourceSchema = z.strictObject({
  "source_id": IdSchema,
  "provider": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "source_type": z.literal(["weather","tide","river","traffic","sensor","camera","driver","community","authority"]),
  "role": z.literal(["context","observation","restriction"]),
  "access_status": z.literal(["available","unavailable","restricted"]),
  "is_simulated": z.boolean(),
  "policy_profile_id": z.union([IdSchema, z.null()]),
  "provenance": ProvenanceSchema,
});
export type Source = z.infer<typeof SourceSchema>;
