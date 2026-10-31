import { z } from "zod";
import { ImpactSchema } from "./impact";
import { KnowledgeSchema } from "./knowledge";
import { OperationsSchema } from "./operations";
import { PlanSchema } from "./plan";
import { PlanningJobSchema } from "./planning-job";
import { ResultsSchema } from "./results";
import { ScenarioSummarySchema } from "./scenario-summary";
import { SessionMetaSchema } from "./session-meta";
import { SimulationClockSchema } from "./simulation-clock";

export const SessionSnapshotSchema = z.strictObject({
  "session": SessionMetaSchema,
  "scenario": ScenarioSummarySchema,
  "clock": SimulationClockSchema,
  "knowledge": KnowledgeSchema,
  "operations": OperationsSchema,
  "impact": ImpactSchema,
  "latest_plan": z.union([PlanSchema, z.null()]),
  "active_job": z.union([PlanningJobSchema, z.null()]),
  "results": ResultsSchema,
  "graph_hash": z.string().refine(v => [...v].length <= 128, "String too long"),
});
export type SessionSnapshot = z.infer<typeof SessionSnapshotSchema>;
