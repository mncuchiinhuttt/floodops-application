import { z } from "zod";

export const CursorFrameSchema = z.strictObject({
  "next_sequence": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
});
export type CursorFrame = z.infer<typeof CursorFrameSchema>;
