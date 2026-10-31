import { z } from "zod";
import { MetaSchema } from "./meta";
import { NotificationListSchema } from "./notification-list";

export const NotificationListResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": NotificationListSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;
