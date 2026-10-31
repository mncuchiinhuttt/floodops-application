import { createHash } from "node:crypto";
import type { Conflict, Participant, Report } from "@floodops/contracts";
import { createFunctionalScenario } from "@floodops/test-fixtures";
import { proposeReportSubmission } from "@floodops/domain/reporting";
import type { ReportContext } from "@floodops/domain/reporting";
import { deriveKnowledgeSnapshot } from "@floodops/domain/knowledge";
import { advanceRun, applyKnowledgeTransition, createRun, loadScenario, sealScenarioDraft } from "@floodops/simulation";
import type { SimulationRun } from "@floodops/simulation";
import { createReviewSeed, prepareImageReviewBinding } from "../../../src/features/reports/review/index";
import type { ImageMetadata, SourceReviewPort } from "../../../src/features/reports/review/index";
import type { Initialization } from "../../../src/session-runtime/index";
import type { SessionSeed, Snapshot, TransitionContext } from "../../../src/shared/index";

export const reportA = "report_runtime001", reportB = "report_runtime002", reportDriver = "report_driver001";
export const contributorA = "contributor_person01", contributorB = "contributor_person02";
export const imageConfig = { model: "synthetic-image-review", model_config_hash: "b".repeat(64), prompt_version: "image-review-test-v1" };
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const draft = createFunctionalScenario();
const communitySource = draft.sourceSnapshot.sources.find(source => source.source_id === "src_citizen1")!;
draft.sourceSnapshot.sources.push({ ...communitySource, source_id: "src_driver001", source_type: "driver",
  provider: "Synthetic driver report with configured low-confidence profile" });
const bundle = loadScenario(sealScenarioDraft(draft, sha), sha);
interface Original { participant: Participant; epochs: ReportContext["epochs"]; receivedAt: string }
export interface SourceFixture {
  run: Omit<SimulationRun, "scenario">; reports: Report[]; conflicts: Conflict[];
  originals: Record<string, Original>; images: Record<string, ImageMetadata>;
}
export function fixtureSource(snapshot: Snapshot): SourceFixture {
  const value = snapshot.values.reviewTestSource as SourceFixture | undefined;
  if (!value) throw new Error("Missing declared review test adapter");
  return value;
}
function runOf(value: SourceFixture): SimulationRun { return { ...structuredClone(value.run), scenario: bundle }; }
function checkpoint(run: SimulationRun): SourceFixture["run"] {
  const { scenario: _scenario, ...state } = run; void _scenario; return structuredClone(state);
}
function pairs(run: SimulationRun) {
  return run.knowledge.map(({ segment_id, vehicle_type, knowledge_epoch }) => ({ segment_id, vehicle_type, knowledge_epoch }));
}
function evidence(run: SimulationRun) {
  return { graph: bundle.manifest.graph, t0: bundle.manifest.config.t0, nowSimMinute: run.nowMs / 60_000,
    sources: run.sourceSnapshot.sources, profiles: bundle.manifest.config.source_policy_profiles,
    parameters: bundle.manifest.config.parameters, observations: run.sourceSnapshot.observations,
    restrictions: run.sourceSnapshot.restrictions, inputEvents: run.sourceSnapshot.inputEvents,
    sourceFixtures: bundle.manifest.config.source_fixtures };
}
function contextFor(run: SimulationRun, participant: Participant, id: string, epochs = pairs(run), revision = 0): ReportContext {
  return { ...evidence(run), participant, boundVehicleTypes: ["motorbike", "car", "truck"],
    dispatcherEntities: [...[contributorA, contributorB].map(entity_id => ({ entity_id, kind: "citizen" as const,
      vehicle_types: ["motorbike", "car", "truck"] as const })),
      { entity_id: "drv_moto01", kind: "driver", vehicle_types: ["motorbike"] }],
    sourceId: id === reportDriver ? "src_driver001" : "src_citizen1", reportId: id,
    inputRevision: revision, receivedAt: bundle.manifest.config.t0, epochs,
    fixtureAssets: bundle.manifest.config.fixture_assets, media: null };
}
function coverage(run: SimulationRun) {
  const current = pairs(run), scope = bundle.manifest.config.relevant_scope_pairs.map(pair => current.find(item =>
    item.segment_id === pair.segment_id && item.vehicle_type === pair.vehicle_type)!);
  return { scope, knowledge: run.knowledge, observations: run.sourceSnapshot.observations,
    sources: run.sourceSnapshot.sources, now_sim_minute: run.nowMs / 60_000 };
}
export async function loadReviewScenario(id: string, version: string): Promise<SessionSeed> {
  if (id !== "scn_functional1" || version !== "1") throw new Error("Unknown review test scenario");
  const run = createRun(bundle, "run_review001");
  return { scenario_id: id, scenario_version: version, horizon_minute: bundle.manifest.config.horizon_minute,
    calibration_status: "incomplete", entities: { driver: bundle.manifest.initial.drivers.map(item => item.driver_id),
      contributor: [contributorA, contributorB] }, values: { reviewTestSource: {
        run: checkpoint(run), reports: [], conflicts: [], originals: {}, images: {} } satisfies SourceFixture,
      reviewRewardsSeed: createReviewSeed(coverage(run)) } };
}
/** Declared synthetic source/media test adapter; never a production raw-media fallback. */
export async function prepareInstallation(input: Initialization): Promise<Initialization> {
  const seed = await loadReviewScenario(input.seed.scenario_id, input.seed.scenario_version);
  const value = seed.values.reviewTestSource as SourceFixture, run = runOf(value);
  for (const binding of [{ id: reportA, entity: contributorA, driver: false }, { id: reportB, entity: contributorB, driver: false },
    { id: reportDriver, entity: "drv_moto01", driver: true }]) {
    const sourceContext = contextFor(run, input.credentials.record.participant, binding.id);
    const common = { segment_id: "seg_edge27", coordinate: [106.701, 10.7705], captured_at: bundle.manifest.config.t0,
      captured_sim_minute: 0, vehicle_types: ["motorbike"], description: "Synthetic report; no real-road claim", reporter_entity_id: binding.entity };
    const raw = binding.driver ? { ...common, kind: "driver", input_mode: "quick", quick_condition: "impassable" }
      : { ...common, kind: "citizen", media_id: null, fixture_photo_id: "photo_fixture01" };
    const submitted = proposeReportSubmission(raw, sourceContext);
    if (submitted.report.status !== "pending_review") throw new Error("Invalid canonical submission fixture");
    if (!binding.driver) {
      const metadata: ImageMetadata = { normalized_hash: bundle.manifest.config.fixture_assets[0]!.sha256, ready: true, duplicate: false };
      value.images[binding.id] = { ...metadata, prepared: await prepareImageReviewBinding(
        { session_id: input.sessionId, generation: input.generation }, submitted.report, metadata, imageConfig) };
    }
    value.reports.push(submitted.report);
    value.originals[binding.id] = { participant: structuredClone(sourceContext.participant), epochs: submitted.capturedEpochs,
      receivedAt: sourceContext.receivedAt };
  }
  return { ...input, seed };
}
export const sourcePort: SourceReviewPort = {
  read(context) {
    const value = fixtureSource(context.snapshot), run = runOf(value), input = coverage(run);
    return { reports: value.reports, knowledge: run.knowledge, conflicts: value.conflicts, pairs: pairs(run),
      relevantScope: input.scope, evidence: evidence(run) };
  },
  report: (snapshot, id) => fixtureSource(snapshot).reports.find(report => report.report_id === id) ?? null,
  reportContext(context, report) {
    const value = fixtureSource(context.snapshot), original = value.originals[report.report_id];
    if (!original) throw new Error("Missing original submitter metadata");
    return { ...contextFor(runOf(value), original.participant, report.report_id, [...original.epochs], context.snapshot.meta.revision),
      receivedAt: original.receivedAt };
  },
  image: (snapshot, report) => fixtureSource(snapshot).images[report.report_id] ?? null,
  apply(context, change) {
    const previous = fixtureSource(context.snapshot), run = runOf(previous);
    const next = applyKnowledgeTransition(run, [...change.knowledge], { sourceSnapshot: {
      ...run.sourceSnapshot, observations: [...change.observations] }, reasonId: "test-review-source-apply" });
    return { ...context.snapshot.values, reviewTestSource: { ...previous, run: checkpoint(next),
      reports: structuredClone([...change.reports]), conflicts: structuredClone([...change.conflicts]) } satisfies SourceFixture };
  },
};
export function advanceFixture(context: TransitionContext, minute: number) {
  const previous = fixtureSource(context.snapshot), advanced = advanceRun(runOf(previous), minute,
    { authorizeEntry: () => ({ allowed: false, reason: "TEST_NO_ROUTE_AUTHORITY" }) });
  if (!advanced.complete) throw new Error("Test fixture advance did not complete");
  const knowledge = deriveKnowledgeSnapshot(pairs(advanced.run), evidence(advanced.run));
  const next = applyKnowledgeTransition(advanced.run, knowledge, { sourceSnapshot: advanced.run.sourceSnapshot, reasonId: "test-clock" });
  return { values: { ...context.snapshot.values, reviewTestSource: { ...previous, run: checkpoint(next) } },
    simMinute: minute, data: { sim_minute: minute } };
}

/** Frozen original synthetic PNG bytes; explicit approved-fixture adapter only. */
export function syntheticImageBytes(): Uint8Array {
  return Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAgklEQVR4nO3PMRGAMBQE0ciJHOrU2MAQIuIgDnBAEwlBwh+a/TA7c+UW98qc17Nz3MFl60u2QwLoQwLoQwLoQwLoQwLoQwLoQwLoQy8BW9uDy9YLoHsBdC+A7gXQvQC6F0D3Auj+L4B69OCy9QLoXgDdC6B7AXQvgO4F0L0Auv88YAG0If2tTU0etAAAAABJRU5ErkJggg=="), character => character.charCodeAt(0));
}
