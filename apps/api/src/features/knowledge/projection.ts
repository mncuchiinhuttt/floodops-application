import type { Coverage, Observation, SegmentKnowledge, VehicleType } from "@floodops/contracts";
import { deriveKnowledgeSnapshot } from "@floodops/domain/knowledge";
import type { SimulationRun } from "@floodops/simulation";
import type { Snapshot, TransitionContext } from "../../shared/index";
import { fail } from "../../shared/index";
import { sourceEnvironment } from "../scenario/index";
import type { SourcesPorts } from "../scenario/index";
export function currentKnowledge(ports: SourcesPorts, snapshot: Snapshot) {
  const run = ports.simulationPersistence.read(snapshot.values);
  return deriveKnowledgeSnapshot(run.knowledge, sourceEnvironment(ports, snapshot));
}
export function coverage(segments: readonly SegmentKnowledge[]): Coverage {
  const covered_pairs = segments.filter(pair => pair.state === "known" && pair.condition !== "unknown").length;
  return { covered_pairs, relevant_pairs: segments.length, ratio: segments.length ? covered_pairs / segments.length : null };
}
export function driverScope(ports: SourcesPorts, context: TransitionContext): { vehicle: VehicleType; segmentIds: Set<string> } | null {
  if (context.actor.participant.role !== "driver") return null;
  const run: SimulationRun = ports.simulationPersistence.read(context.snapshot.values);
  const branch = run.branches.floodops, driver = branch?.operations.drivers.find(item => item.driver_id === context.actor.participant.bound_entity_id);
  if (!driver) fail(404, "NOT_FOUND");
  const ids = new Set(branch!.runtime[driver.driver_id]?.segments ?? []);
  if (driver.position.kind === "on_edge") ids.add(driver.position.segment_id!);
  return { vehicle: driver.vehicle_type, segmentIds: ids };
}
export function scopedKnowledge(ports: SourcesPorts, context: TransitionContext) {
  const environment = sourceEnvironment(ports, context.snapshot), scope = driverScope(ports, context);
  const segments = currentKnowledge(ports, context.snapshot).filter(pair => !scope || (pair.vehicle_type === scope.vehicle && scope.segmentIds.has(pair.segment_id)));
  const observations: Observation[] = environment.observations.filter(item => segments.some(pair => pair.segment_id === item.segment_id
    && item.vehicle_types.includes(pair.vehicle_type) && item.knowledge_epoch === pair.knowledge_epoch && pair.observation_ids.includes(item.observation_id)));
  const restrictions = environment.restrictions.filter(item => segments.some(pair => pair.restriction_ids.includes(item.restriction_id)))
    .map(item => ({ ...item, vehicle_types: item.vehicle_types.filter(vehicle => segments.some(pair => pair.vehicle_type === vehicle && pair.restriction_ids.includes(item.restriction_id))) }));
  return { segments, observations, restrictions, coverage: coverage(segments) };
}
