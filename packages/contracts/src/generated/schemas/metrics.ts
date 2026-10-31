import { z } from "zod";

export const MetricsSchema = z.strictObject({
  "critical_late": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "total_late": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "total_delay_minutes": z.number().finite().min(0),
  "blocked_route_attempts": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "blocked_proposal_attempts": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "blocked_movement_attempts": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "orders_reassigned": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "updated_eta_previews": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "unfinished_count": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "unreachable_count": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "executed_violations": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
});
export type Metrics = z.infer<typeof MetricsSchema>;
