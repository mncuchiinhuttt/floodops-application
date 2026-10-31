import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { DeterministicPlannerMetadataSchema } from "./deterministic-planner-metadata";
import { IdSchema } from "./id";

export const PlanningJobSchema = z.strictObject({
  "job_id": IdSchema,
  "session_id": IdSchema,
  "generation": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "input_revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "status": z.literal(["queued","running","completed","failed","superseded","cancelled"]),
  "plan_id": z.union([IdSchema, z.null()]),
  "error_code": z.union([z.literal(["NO_FEASIBLE_PLAN","CONFIG_INCOMPLETE","STATE_CONFLICT","STALE_PROPOSAL","SESSION_RESET","SESSION_EXPIRED","STORAGE_UNAVAILABLE","PLANNER_TIMEOUT"]), z.null()]),
  "created_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "completed_at": z.union([z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"), z.null()]),
  "planner": DeterministicPlannerMetadataSchema,
}).refine(v => z.unknown().refine(v => !z.object({"error_code": z.literal("NO_FEASIBLE_PLAN").optional()}).safeParse(v).success || z.object({"status": z.literal("failed").optional(), "plan_id": z.null().optional(), "completed_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp").optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"status": z.literal("completed").optional()}).safeParse(v).success || z.object({"plan_id": IdSchema.optional(), "error_code": z.null().optional(), "completed_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp").optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"status": z.literal("failed").optional()}).safeParse(v).success || z.object({"plan_id": z.null().optional(), "error_code": z.literal(["NO_FEASIBLE_PLAN","CONFIG_INCOMPLETE","STATE_CONFLICT","STALE_PROPOSAL","SESSION_RESET","SESSION_EXPIRED","STORAGE_UNAVAILABLE","PLANNER_TIMEOUT"]).optional(), "completed_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp").optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"status": z.literal(["queued","running"]).optional()}).safeParse(v).success || z.object({"plan_id": z.null().optional(), "error_code": z.null().optional(), "completed_at": z.null().optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"status": z.literal(["superseded","cancelled"]).optional()}).safeParse(v).success || z.object({"plan_id": z.null().optional(), "error_code": z.null().optional(), "completed_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp").optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").describe("M1 deterministic planner job. NO_FEASIBLE_PLAN means no valid candidate found within declared bounded search; state is preserved and dispatcher may replan. It is not a proof of global infeasibility. Auth/CAS/latest-job/manual Execute fences remain.");
export type PlanningJob = z.infer<typeof PlanningJobSchema>;
