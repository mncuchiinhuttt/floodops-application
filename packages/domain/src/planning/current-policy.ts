import { OperationError } from "@floodops/domain/operations";
import type { SimulationPolicy, SimulationRun } from "@floodops/simulation";
import { capturedEntryKnowledge, roadKnowledgeGuard } from "./road-knowledge.ts";

/** Committed entry authority is captured independently of every unexecuted proposal. */
export function createCurrentPolicy(run: SimulationRun, authority: SimulationPolicy): SimulationPolicy {
  if (!authority || typeof authority.authorizeEntry !== "function") {
    throw new OperationError("CONFIG_INCOMPLETE", "Explicit committed/current simulation policy required.");
  }
  return { authorizeEntry(context) {
    const knowledge = capturedEntryKnowledge(run, context);
    const captured = run.knowledge.find(k => k.segment_id === context.segmentId && k.vehicle_type === context.driver.vehicle_type);
    const guard = roadKnowledgeGuard(knowledge, context.atMinute, [context.segmentId, context.driver.driver_id], captured?.knowledge_epoch);
    if (guard) return { allowed: false, reason: guard.code };
    // Preserve the branch and driver; this port supplies its own committed grants, not proposal approvals.
    return authority.authorizeEntry(structuredClone({ ...context, knowledge }));
  } };
}
