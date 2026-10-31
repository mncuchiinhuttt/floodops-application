import { z } from "zod";

export const BranchIdSchema = z.literal(["static","floodops","reroute_only"]);
export type BranchId = z.infer<typeof BranchIdSchema>;
