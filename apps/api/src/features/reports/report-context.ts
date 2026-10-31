import type { SubmitReportInput } from "@floodops/contracts";
import { sourceState } from "@floodops/domain/reporting";
import type { ReportContext } from "@floodops/domain/reporting";
import type { TransitionContext } from "../../shared/index";
import { fail } from "../../shared/index";
import { scenarioOf, sourceEnvironment } from "../scenario/index";
import { captureEpochs } from "./capture-epochs";
import type { SourcesPorts } from "../scenario/index";
export function reportContext(ports: SourcesPorts, context: TransitionContext, input: SubmitReportInput, reportId: string): ReportContext {
  const environment = sourceEnvironment(ports, context.snapshot), scenario = scenarioOf(ports, context.snapshot), actor = context.actor.participant;
  const source = environment.sources.filter(source => source.source_type === (input.kind === "driver" ? "driver" : "community") && source.role === "observation");
  if (source.length !== 1) fail(503, "CONFIG_INCOMPLETE");
  const run = ports.simulationPersistence.read(context.snapshot.values), state = sourceState(context.snapshot.values);
  const media = input.kind === "citizen" && input.media_id !== null ? Object.values(state.uploads).find(item => item.media?.media_id === input.media_id) : undefined;
  if (input.kind === "citizen" && input.media_id !== null && (!media || media.ownerId !== actor.participant_id || media.generation !== context.snapshot.meta.generation)) fail(404, "NOT_FOUND");
  if (media && (!media.media || media.upload.status !== "ready")) fail(409, "MEDIA_NOT_READY");
  const drivers = scenario.manifest.initial.drivers;
  const allVehicles = [...new Set(scenario.manifest.graph.segments.flatMap(item => item.allowed_vehicle_types))];
  const receivedAt = new Date(context.now).toISOString();
  const receiptRewardPolicy = ports.receiptRewardPolicy?.({ sessionId: context.snapshot.meta.session_id, generation: context.snapshot.meta.generation,
    scenarioId: context.snapshot.meta.scenario_id, scenarioVersion: context.snapshot.meta.scenario_version, receivedAt, kind: input.kind }) ?? null;
  return { ...environment, receiptRewardPolicy, nowWall: context.now, participant: actor, reportId, sourceId: source[0]!.source_id, inputRevision: context.snapshot.meta.revision,
    receivedAt, epochs: captureEpochs(run, input.captured_sim_minute, state.epochHistory),
    boundVehicleTypes: actor.role === "driver" ? [drivers.find(driver => driver.driver_id === actor.bound_entity_id)?.vehicle_type ?? fail(404, "NOT_FOUND")] : allVehicles,
    dispatcherEntities: [...context.snapshot.seed.entities.driver.map(entity_id => ({ entity_id, kind: "driver" as const,
      vehicle_types: [drivers.find(driver => driver.driver_id === entity_id)?.vehicle_type ?? fail(503, "CONFIG_INCOMPLETE")] })),
      ...context.snapshot.seed.entities.contributor.map(entity_id => ({ entity_id, kind: "citizen" as const, vehicle_types: allVehicles }))],
    fixtureAssets: scenario.manifest.config.fixture_assets, media: media?.media ? { media_id: media.media.media_id, normalized: true, duplicate: media.duplicate || Object.values(state.reports).some(item => item.report.media_id === media.media!.media_id) } : null };
}
