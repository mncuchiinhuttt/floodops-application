import { z } from "zod";

export const QuantitySchema = z.strictObject({
  "dimension": z.string().refine(v => [...v].length <= 60, "String too long"),
  "value": z.number().finite().min(0),
  "unit": z.string().refine(v => [...v].length <= 40, "String too long"),
  "parameter_key": z.string().refine(v => [...v].length <= 100, "String too long"),
});
export type Quantity = z.infer<typeof QuantitySchema>;
