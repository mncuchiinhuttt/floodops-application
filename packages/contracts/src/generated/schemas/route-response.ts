import { z } from "zod";
import { MetaSchema } from "./meta";
import { RouteSchema } from "./route";

export const RouteResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": RouteSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type RouteResponse = z.infer<typeof RouteResponseSchema>;
