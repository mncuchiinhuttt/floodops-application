import type { SimulationRun } from "@floodops/simulation";
import type { SourcesMediaState } from "@floodops/domain/reporting";
import { fail } from "../../shared/index";
export function captureEpochs(run: SimulationRun, minute: number, history: SourcesMediaState["epochHistory"]) {
  return run.knowledge.map(pair => {
    const initial = run.scenario.manifest.initialKnowledge.find(item => item.segment_id === pair.segment_id && item.vehicle_type === pair.vehicle_type);
    if (!initial) fail(503, "CONFIG_INCOMPLETE");
    const events = [...run.scenario.manifest.events.flatMap(event => event.knowledge && event.knowledge.segment_id === pair.segment_id
      && event.knowledge.vehicle_type === pair.vehicle_type ? [{ atMinute: event.atMinute, epoch: event.knowledge.knowledge_epoch }] : []),
      ...history.filter(item => item.segment_id === pair.segment_id && item.vehicle_type === pair.vehicle_type)
        .map(item => ({ atMinute: item.atMinute, epoch: item.knowledge_epoch }))];
    const epochAt = (at: number) => events.filter(item => item.atMinute <= at).reduce((epoch, item) => Math.max(epoch, item.epoch), initial.knowledge_epoch);
    if (epochAt(run.nowMs / 60000) !== pair.knowledge_epoch && minute < run.nowMs / 60000) fail(503, "CONFIG_INCOMPLETE");
    return { segment_id: pair.segment_id, vehicle_type: pair.vehicle_type, knowledge_epoch: minute === run.nowMs / 60000 ? pair.knowledge_epoch : epochAt(minute) };
  });
}
