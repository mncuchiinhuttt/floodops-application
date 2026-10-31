import { z } from "zod";

export const PageSchema = z.strictObject({
  "next_cursor": z.union([z.string().refine(v => [...v].length <= 2048, "String too long"), z.null()]),
  "has_more": z.boolean(),
});
export type Page = z.infer<typeof PageSchema>;
