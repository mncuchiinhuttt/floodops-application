import { z } from "zod";
import { CoverageSchema } from "./coverage";
import { ResultsSchema } from "./results";
import { ScenarioSummarySchema } from "./scenario-summary";
import { SessionMetaSchema } from "./session-meta";

export const ViewerOverviewSchema = z.strictObject({
  "session": SessionMetaSchema,
  "scenario": ScenarioSummarySchema,
  "coverage": CoverageSchema,
  "results": ResultsSchema,
});
export type ViewerOverview = z.infer<typeof ViewerOverviewSchema>;
