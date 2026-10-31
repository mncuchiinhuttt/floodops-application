import { z } from "zod";
import { ConflictSchema } from "./conflict";
import { PageSchema } from "./page";

export const ConflictListSchema = z.strictObject({
  "items": z.array(ConflictSchema).refine(v => v.length <= 100, "Too many items"),
  "page": PageSchema,
});
export type ConflictList = z.infer<typeof ConflictListSchema>;
