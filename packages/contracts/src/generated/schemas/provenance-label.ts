import { z } from "zod";

export const ProvenanceLabelSchema = z.literal(["reference","replayed","simulated"]);
export type ProvenanceLabel = z.infer<typeof ProvenanceLabelSchema>;
