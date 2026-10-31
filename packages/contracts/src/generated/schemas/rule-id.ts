import { z } from "zod";

export const RuleIdSchema = z.literal(["POL-01","POL-02","POL-03","POL-04","POL-05","POL-06","POL-07","POL-08"]);
export type RuleId = z.infer<typeof RuleIdSchema>;
