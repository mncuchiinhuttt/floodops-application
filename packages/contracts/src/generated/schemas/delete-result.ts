import { z } from "zod";
import { IdSchema } from "./id";

export const DeleteResultSchema = z.strictObject({
  "session_id": IdSchema,
  "status": z.literal(["expired"]),
});
export type DeleteResult = z.infer<typeof DeleteResultSchema>;
