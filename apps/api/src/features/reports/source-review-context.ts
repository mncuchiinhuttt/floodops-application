import type { Report } from "@floodops/contracts";
import type { ReportContext } from "@floodops/domain/reporting";
import type { TransitionContext } from "../../shared/index";
import { fail } from "../../shared/index";
import { scenarioOf, sourceEnvironment } from "../scenario/index";
import type { SourcesPorts } from "../scenario/index";
import { requireStored, sourceImage } from "./source-review-state";
/** Reconstruct admission facts from the receipt, never the reviewing actor. */
export function originalReportContext(ports: SourcesPorts, context: TransitionContext, report: Report): ReportContext {
  const stored = requireStored(context.snapshot, report), scenario = scenarioOf(ports, context.snapshot);
  const drivers = scenario.manifest.initial.drivers;
  const allVehicles = [...new Set(scenario.manifest.graph.segments.flatMap(item => item.allowed_vehicle_types))];
  const image = sourceImage(context.snapshot, report);
  return { ...sourceEnvironment(ports, context.snapshot), nowWall: context.now, participant: structuredClone(stored.originalSubmitter),
    reportId: report.report_id, sourceId: stored.sourceId, inputRevision: context.snapshot.meta.revision,
    receivedAt: report.received_at, epochs: structuredClone(stored.capturedEpochs), boundVehicleTypes: [...stored.boundVehicleTypes],
    dispatcherEntities: [...context.snapshot.seed.entities.driver.map(entity_id => ({ entity_id, kind: "driver" as const,
      vehicle_types: [drivers.find(driver => driver.driver_id === entity_id)?.vehicle_type ?? fail(503, "CONFIG_INCOMPLETE")] })),
      ...context.snapshot.seed.entities.contributor.map(entity_id => ({ entity_id, kind: "citizen" as const, vehicle_types: allVehicles }))],
    fixtureAssets: scenario.manifest.config.fixture_assets,
    media: report.media_id && image?.ready ? { media_id: report.media_id, normalized: true, duplicate: image.duplicate } : null };
}
