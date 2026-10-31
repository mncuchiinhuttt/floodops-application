import { z } from "zod";

export const ConfidenceSchema = z.literal(["high","low"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;
