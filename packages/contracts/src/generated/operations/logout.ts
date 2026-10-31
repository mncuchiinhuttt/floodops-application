import { z } from "zod";
import { IdSchema } from "../schemas/id";

export const logout = {
  id: "logout", method: "POST",
  path: "/sessions/{session_id}/logout", roles: ["dispatcher","driver","contributor","viewer"],
  requiresRevision: false, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
}),
  responses: {  },
  statuses: [204], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "empty", mediaTypes: [],
} as const;
export type LogoutInput = z.infer<typeof logout.input>;
export type LogoutOutput = undefined;
