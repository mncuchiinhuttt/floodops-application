import { z } from "zod";
import { CoordinateSchema } from "./coordinate";
import { IdSchema } from "./id";

export const GraphNodeSchema = z.strictObject({
  "node_id": IdSchema,
  "coordinate": CoordinateSchema,
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;
