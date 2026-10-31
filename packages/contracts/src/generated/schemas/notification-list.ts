import { z } from "zod";
import { NotificationSchema } from "./notification";
import { PageSchema } from "./page";

export const NotificationListSchema = z.strictObject({
  "items": z.array(NotificationSchema).refine(v => v.length <= 100, "Too many items"),
  "page": PageSchema,
});
export type NotificationList = z.infer<typeof NotificationListSchema>;
