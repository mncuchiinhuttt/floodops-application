import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { IdSchema } from "./id";
import { ImageReviewAdviceSchema } from "./image-review-advice";

export const ImageReviewJobSchema = z.strictObject({
  "job_id": IdSchema,
  "session_id": IdSchema,
  "generation": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "report_id": IdSchema,
  "input_digest": z.string().regex(new RegExp("^[0-9a-f]{64}$")),
  "model": z.string().refine(v => [...v].length >= 1, "String too short").refine(v => [...v].length <= 100, "String too long"),
  "model_config_hash": z.string().regex(new RegExp("^[0-9a-f]{64}$")),
  "rubric_version": z.literal("image-quality-v1"),
  "status": z.literal(["queued","running","completed","failed","superseded"]),
  "result": z.union([ImageReviewAdviceSchema, z.null()]),
  "error_code": z.union([z.literal(["MODEL_TIMEOUT","MODEL_REFUSED","MODEL_INVALID_OUTPUT","MODEL_UNAVAILABLE","STORAGE_UNAVAILABLE"]), z.null()]),
  "created_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "deadline_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "completed_at": z.union([z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"), z.null()]),
}).refine(v => z.unknown().refine(v => !z.object({"status": z.literal("completed").optional()}).safeParse(v).success || z.object({"result": ImageReviewAdviceSchema.optional(), "error_code": z.null().optional(), "completed_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp").optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"status": z.literal("failed").optional()}).safeParse(v).success || z.object({"result": z.null().optional(), "error_code": z.literal(["MODEL_TIMEOUT","MODEL_REFUSED","MODEL_INVALID_OUTPUT","MODEL_UNAVAILABLE","STORAGE_UNAVAILABLE"]).optional(), "completed_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp").optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"status": z.literal(["queued","running"]).optional()}).safeParse(v).success || z.object({"result": z.null().optional(), "error_code": z.null().optional(), "completed_at": z.null().optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"status": z.literal("superseded").optional()}).safeParse(v).success || z.object({"result": z.null().optional(), "error_code": z.null().optional(), "completed_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp").optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint");
export type ImageReviewJob = z.infer<typeof ImageReviewJobSchema>;
