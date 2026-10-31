import { z } from "zod";

export const ConditionSchema = z.literal(["normal","caution","impassable","unknown"]);
export type Condition = z.infer<typeof ConditionSchema>;
