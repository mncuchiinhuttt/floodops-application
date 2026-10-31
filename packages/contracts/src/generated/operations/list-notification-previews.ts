import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { NotificationListResponseSchema } from "../schemas/notification-list-response";

export const listNotificationPreviews = {
  id: "listNotificationPreviews", method: "GET",
  path: "/sessions/{session_id}/notifications", roles: ["dispatcher"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({
  "cursor": z.string().refine(v => [...v].length <= 2048, "String too long").optional(),
  "limit": z.number().finite().refine(Number.isInteger, "Expected integer").min(1).max(100).optional(),
}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: NotificationListResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type ListNotificationPreviewsInput = z.infer<typeof listNotificationPreviews.input>;
export type ListNotificationPreviewsOutput = z.infer<typeof listNotificationPreviews.responses[200]>;
