import { z } from "zod";

export const CoordinateSchema = z.tuple([z.number().finite().min(-180).max(180), z.number().finite().min(-90).max(90)]).refine(v => v.length >= 2, "Too few items").refine(v => v.length <= 2, "Too many items").describe("WGS84 [longitude, latitude].");
export type Coordinate = z.infer<typeof CoordinateSchema>;
