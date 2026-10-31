import { z } from "zod";

export const VehicleTypeSchema = z.literal(["motorbike","car","truck"]);
export type VehicleType = z.infer<typeof VehicleTypeSchema>;
