import { z } from "zod";
import { KnowledgeSchema } from "./knowledge";
import { MetaSchema } from "./meta";

export const KnowledgeResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": KnowledgeSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type KnowledgeResponse = z.infer<typeof KnowledgeResponseSchema>;
