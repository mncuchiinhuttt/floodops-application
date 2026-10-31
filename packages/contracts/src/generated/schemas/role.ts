import { z } from "zod";

export const RoleSchema = z.literal(["dispatcher","driver","contributor","viewer"]);
export type Role = z.infer<typeof RoleSchema>;
