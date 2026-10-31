import { z } from "zod";

export const UploadCompletionInputSchema = z.strictObject({
  "confirm_uploaded": z.literal(true),
});
export type UploadCompletionInput = z.infer<typeof UploadCompletionInputSchema>;
