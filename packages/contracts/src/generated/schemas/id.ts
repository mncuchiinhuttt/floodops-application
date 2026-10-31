import { z } from "zod";

export const IdSchema = z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$"));
export type Id = z.infer<typeof IdSchema>;
