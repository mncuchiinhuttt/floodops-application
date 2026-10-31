import { z } from "zod";
import { CoordinateSchema } from "./coordinate";

export const PolylineSchema = z.array(CoordinateSchema).refine(v => v.length >= 2, "Too few items").refine(v => v.length <= 10000, "Too many items");
export type Polyline = z.infer<typeof PolylineSchema>;
