import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { ReplayInputSchema } from "../schemas/replay-input";
import { RestrictionResponseSchema } from "../schemas/restriction-response";

export const applyRestrictionFixture = {
  id: "applyRestrictionFixture", method: "POST",
  path: "/sessions/{session_id}/restrictions", roles: ["dispatcher"],
  requiresRevision: true, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "If-Match": z.string().regex(new RegExp("^\"s:[A-Za-z0-9_-]+:g:[0-9]+:r:[0-9]+\"$")),
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
  "body": ReplayInputSchema,
}),
  responses: { 201: RestrictionResponseSchema },
  statuses: [201], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type ApplyRestrictionFixtureInput = z.infer<typeof applyRestrictionFixture.input>;
export type ApplyRestrictionFixtureOutput = z.infer<typeof applyRestrictionFixture.responses[201]>;
