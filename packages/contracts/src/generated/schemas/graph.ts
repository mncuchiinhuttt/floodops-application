import { z } from "zod";
import { GraphNodeSchema } from "./graph-node";
import { RoadSegmentSchema } from "./road-segment";

export const GraphSchema = z.strictObject({
  "graph_hash": z.string().refine(v => [...v].length <= 128, "String too long"),
  "nodes": z.array(GraphNodeSchema),
  "segments": z.array(RoadSegmentSchema),
});
export type Graph = z.infer<typeof GraphSchema>;
