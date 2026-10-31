import { z } from "zod";
import { CoverageSchema } from "./coverage";
import { ObservationSchema } from "./observation";
import { RestrictionSchema } from "./restriction";
import { SegmentKnowledgeSchema } from "./segment-knowledge";

export const KnowledgeSchema = z.strictObject({
  "segments": z.array(SegmentKnowledgeSchema),
  "observations": z.array(ObservationSchema),
  "restrictions": z.array(RestrictionSchema),
  "coverage": CoverageSchema,
});
export type Knowledge = z.infer<typeof KnowledgeSchema>;
