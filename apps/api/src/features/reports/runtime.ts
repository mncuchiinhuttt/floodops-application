import { parseSchema, ReportSchema } from "@floodops/contracts";
import { proposeReportSubmission, sourceState } from "@floodops/domain/reporting";
import { proposeObservationAcceptance } from "@floodops/domain/knowledge";
import { applyKnowledgeTransition } from "@floodops/simulation";
import type { RuntimeRegistry, TransitionContext } from "../../shared/index";
import { fail } from "../../shared/index";
import { object, sourceEnvironment } from "../scenario/index";
import { adaptSourceRegistry } from "../scenario/index";
import type { SourcesPorts } from "../scenario/index";
import { MEDIA_LIMITS } from "../media/index";
import { reportContext } from "./report-context";
function submit(ports: SourcesPorts, context: TransitionContext, raw: unknown) {
  const value = object(raw, ["input", "reportId", "fixtureDigest"]), input = parseSchema("SubmitReportInput", value.input), reportId = parseSchema("Id", value.reportId);
  const state = sourceState(context.snapshot.values);
  if (Object.keys(state.reports).length >= MEDIA_LIMITS.reports) fail(429, "RATE_LIMITED");
  if (state.reports[reportId]) fail(409, "STATE_CONFLICT");
  const environment = reportContext(ports, context, input, reportId), submission = proposeReportSubmission(input, environment);
  let report = submission.report, values = { ...context.snapshot.values };
  const currentPairs = ports.simulationPersistence.read(values).knowledge;
  if (submission.capturedEpochs.some(epoch => !currentPairs.some(pair => pair.segment_id === epoch.segment_id && pair.vehicle_type === epoch.vehicle_type && pair.knowledge_epoch === epoch.knowledge_epoch)))
    report = { ...report, status: "needs_clarification", reason_codes: [...report.reason_codes, "NEEDS_CLARIFICATION"] };
  if (report.kind === "driver" && report.input_mode === "quick" && report.status === "pending_review") {
    const run = ports.simulationPersistence.read(values);
    const accepted = proposeObservationAcceptance(report, report.quick_condition!, run.knowledge, { ...sourceEnvironment(ports, context.snapshot), ...environment,
      observationIds: report.vehicle_types.map(vehicle_type => ({ vehicle_type, observation_id: `observation_${reportId.split("_")[1]}_${vehicle_type}` })), reasonId: reportId });
    report = accepted.report;
    values = ports.simulationPersistence.write(values, applyKnowledgeTransition(run, accepted.knowledge,
      { sourceSnapshot: { ...run.sourceSnapshot, observations: accepted.observations }, reasonId: reportId }));
  }
  if (report.input_mode === "text" && report.status === "normalizing") report = { ...report, status: "needs_clarification", reason_codes: ["NEEDS_CLARIFICATION"] };
  let normalizedDigest: string | null = null;
  if (report.media_id) normalizedDigest = Object.values(state.uploads).find(item => item.media?.media_id === report.media_id)?.media?.sha256 ?? null;
  if (report.fixture_photo_id) {
    if (typeof value.fixtureDigest !== "string" || !/^[a-f0-9]{64}$/.test(value.fixtureDigest)) fail(503, "MEDIA_PROCESSING_UNAVAILABLE");
    normalizedDigest = value.fixtureDigest;
  }
  if (normalizedDigest && Object.values(state.reports).some(item => item.normalizedDigest === normalizedDigest))
    report = { ...report, status: "needs_clarification", reason_codes: [...new Set([...report.reason_codes, "DUPLICATE_IMAGE" as const])] };
  // Never persist an intermediate acceptance as a complete M1 DTO. A genuine terminal review identity is required.
  const serialized = ReportSchema.safeParse(report);
  if (!serialized.success) fail(503, "CONFIG_INCOMPLETE");
  report = serialized.data;
  state.reports[reportId] = { report, originalSubmitter: environment.participant, boundVehicleTypes: [...environment.boundVehicleTypes],
    capturedEpochs: submission.capturedEpochs, sourceId: environment.sourceId, generation: context.snapshot.meta.generation, normalizedDigest };
  return { data: report, values: { ...values, sourcesMedia: state }, events: [{ type: "report_changed" as const, resource_ids: [reportId],
    audience: ["dispatcher" as const], participantIds: [context.actor.participant.participant_id] }, ...(report.status === "accepted" ? [{ type: "state_changed" as const, resource_ids: report.observation_ids }] : [])] };
}
export function createReportsRegistry(ports: SourcesPorts): RuntimeRegistry {
  return adaptSourceRegistry({ commands: { "source-authorize-report": { permission: "reports:submit", operational: false, validate: value => value, reduce: (context, raw) => {
      const value = object(raw, ["input", "reportId"]), input = parseSchema("SubmitReportInput", value.input), reportId = parseSchema("Id", value.reportId);
      proposeReportSubmission(input, reportContext(ports, context, input, reportId)); return { data: null, events: [] };
    } }, "source-submit-report": { permission: "reports:submit", operational: true, validate: value => value, reduce: (context, input) => submit(ports, context, input) } },
    views: { "source-reports": { permission: "reports:submit", roles: ["dispatcher", "driver", "contributor"], project: ({ snapshot, actor }) => ({
      participantId: actor.participant.participant_id, generation: snapshot.meta.generation,
      records: Object.values(sourceState(snapshot.values).reports).filter(item => item.generation === snapshot.meta.generation && (actor.participant.role === "dispatcher" || item.report.participant_id === actor.participant.participant_id)) }) },
    "source-image-review": { permission: "reports:review", roles: ["dispatcher"], project: ({ snapshot }) => ({ sessionId: snapshot.meta.session_id,
      generation: snapshot.meta.generation, reports: Object.values(sourceState(snapshot.values).reports), uploads: Object.values(sourceState(snapshot.values).uploads) }) },
    "source-fixture-assets": { permission: "scenario:read", roles: ["dispatcher", "driver", "contributor", "viewer"], project: ({ snapshot }) => ports.scenarioCatalog.get(snapshot.meta.scenario_id, snapshot.meta.scenario_version).manifest.config.fixture_assets } } });
}
