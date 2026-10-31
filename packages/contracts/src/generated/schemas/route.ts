import { z } from "zod";
import { CandidateAssignmentSchema } from "./candidate-assignment";
import { IdSchema } from "./id";
import { StopSchema } from "./stop";

export const RouteSchema = z.strictObject({
  "route_id": IdSchema,
  "driver_id": IdSchema,
  "input_revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "segment_ids": z.array(IdSchema),
  "stops": z.array(StopSchema),
  "eta_minute": z.union([z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."), z.null()]),
  "evidence_ids": z.array(IdSchema),
  "unknown_segment_ids": z.array(IdSchema),
  "status": z.literal(["candidate","no_route"]),
  "distance_m": z.number().finite().min(0),
  "candidate_context_hash": z.string().refine(v => [...v].length <= 128, "String too long"),
  "origin_node_id": IdSchema,
  "assignment_overrides": z.array(CandidateAssignmentSchema),
});
export type Route = z.infer<typeof RouteSchema>;
