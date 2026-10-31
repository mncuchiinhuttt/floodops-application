import { z } from "zod";
import { IdSchema } from "../schemas/id";

export const getMedia = {
  id: "getMedia", method: "GET",
  path: "/sessions/{session_id}/media/{media_id}", roles: ["dispatcher","driver","contributor"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "media_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: {  },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "binary", mediaTypes: ["image/jpeg","image/png"],
} as const;
export type GetMediaInput = z.infer<typeof getMedia.input>;
export type GetMediaOutput = Uint8Array;
