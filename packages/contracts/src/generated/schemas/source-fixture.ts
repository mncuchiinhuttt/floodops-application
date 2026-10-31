import { z } from "zod";
import { IdSchema } from "./id";

export const SourceFixtureSchema = z.strictObject({
  "fixture_event_id": IdSchema,
  "source_id": IdSchema,
  "title": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "role": z.literal(["context","observation","restriction"]),
  "scheduled_sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
});
export type SourceFixture = z.infer<typeof SourceFixtureSchema>;
