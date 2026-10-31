import { z } from "zod";
import { IdSchema } from "./id";

export const CreateSessionInputSchema = z.strictObject({
  "scenario_id": IdSchema,
  "scenario_version": z.string().refine(v => [...v].length <= 80, "String too long"),
  "client_type": z.literal(["web","native"]),
});
export type CreateSessionInput = z.infer<typeof CreateSessionInputSchema>;
