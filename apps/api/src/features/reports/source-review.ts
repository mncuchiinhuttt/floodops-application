import { sourceState } from "@floodops/domain/reporting";
import { deriveKnowledgeSnapshot } from "@floodops/domain/knowledge";
import type { TransitionContext } from "../../shared/index";
import { fail } from "../../shared/index";
import { scenarioOf, sourceEnvironment } from "../scenario/index";
import type { SourcesPorts } from "../scenario/index";
import type { SourceReviewPort } from "./review/index";
import { originalReportContext } from "./source-review-context";
import { applySourceReview } from "./source-review-apply";
import { currentSourceConflicts, sourceImage, storedReport } from "./source-review-state";
export function createSourceReviewPort(ports: SourcesPorts): SourceReviewPort {
  return {
    read(context: TransitionContext) {
      const snapshot = context.snapshot, run = ports.simulationPersistence.read(snapshot.values);
      if (run.nowMs / 60000 !== snapshot.meta.sim_minute) fail(503, "CONFIG_INCOMPLETE");
      const evidence = { ...sourceEnvironment(ports, snapshot), nowWall: context.now };
      const knowledge = deriveKnowledgeSnapshot(run.knowledge, evidence);
      const scope = scenarioOf(ports, snapshot).manifest.config.relevant_scope_pairs;
      return { reports: Object.values(sourceState(snapshot.values).reports).filter(item => item.generation === snapshot.meta.generation).map(item => structuredClone(item.report)),
        knowledge, conflicts: currentSourceConflicts(snapshot, knowledge),
        pairs: run.knowledge.map(({ segment_id, vehicle_type, knowledge_epoch }) => ({ segment_id, vehicle_type, knowledge_epoch })),
        relevantScope: scope.map(pair => ({ ...pair, knowledge_epoch: run.knowledge.find(item => item.segment_id === pair.segment_id
          && item.vehicle_type === pair.vehicle_type)?.knowledge_epoch ?? fail(503, "CONFIG_INCOMPLETE") })), evidence };
    },
    report: (snapshot, id) => structuredClone(storedReport(snapshot, id)?.report ?? null),
    reportContext: (context, report) => originalReportContext(ports, context, report),
    image: sourceImage,
    apply: (context, change) => applySourceReview(ports, context, change),
  };
}
