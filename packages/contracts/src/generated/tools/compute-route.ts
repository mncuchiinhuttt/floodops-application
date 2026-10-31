import { z } from "zod";
import { CandidateAssignmentSchema } from "../schemas/candidate-assignment";
import { RouteSchema } from "../schemas/route";
import { StopReferenceSchema } from "../schemas/stop-reference";

export const computeRoute = {
  name: "compute_route",
  input: z.strictObject({
  "driver_id": z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$")),
  "origin_node_id": z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$")),
  "stop_refs": z.array(StopReferenceSchema).refine(v => v.length >= 1, "Too few items").refine(v => v.length <= 100, "Too many items"),
  "assignment_overrides": z.array(CandidateAssignmentSchema).refine(v => v.length <= 100, "Too many items"),
}),
  output: RouteSchema,
  modelCallable: false, milestone: "M1",
  sideEffect: "read_only",
} as const;
