import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { KnowledgeResponseSchema } from "../schemas/knowledge-response";

export const getKnowledge = {
  id: "getKnowledge", method: "GET",
  path: "/sessions/{session_id}/knowledge", roles: ["dispatcher","driver","viewer"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: KnowledgeResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetKnowledgeInput = z.infer<typeof getKnowledge.input>;
export type GetKnowledgeOutput = z.infer<typeof getKnowledge.responses[200]>;
