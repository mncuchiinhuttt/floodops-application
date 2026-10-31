import { z } from "zod";
import { IdSchema } from "./schemas/id";
export const SessionIdParameterSchema = IdSchema;
export const IfMatchParameterSchema = z.string().regex(new RegExp("^\"s:[A-Za-z0-9_-]+:g:[0-9]+:r:[0-9]+\"$"));
export const IdempotencyKeyParameterSchema = z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long");
export const CsrfTokenParameterSchema = z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long");
export const CursorParameterSchema = z.string().refine(v => [...v].length <= 2048, "String too long");
export const LimitParameterSchema = z.number().finite().refine(Number.isInteger, "Expected integer").min(1).max(100);
export const AfterParameterSchema = z.number().finite().refine(Number.isInteger, "Expected integer").min(0);
