import type { Conflict, Participant, Report, RewardPolicyRef } from "@floodops/contracts";
import { parseSchema } from "@floodops/contracts";
import { sourceState } from "@floodops/domain/reporting";
import type { StoredSourceReport } from "@floodops/domain/reporting";
import { advanceRun } from "@floodops/simulation";
import type { SimulationRun } from "@floodops/simulation";
import { createReportCases } from "@floodops/test-fixtures";
import { scenarioCatalog, simulationPersistence, loadSessionScenario } from "../../../src/index";
import { createSourceReviewPort } from "../../../src/features/reports/index";
import { createReviewSeed } from "../../../src/features/reports/review/index";
import type { ImageMetadata } from "../../../src/features/reports/review/index";
import type { Initialization } from "../../../src/session-runtime/index";
import type { PlatformBindings, SessionSeed, Snapshot, TransitionContext } from "../../../src/shared/index";

export const reportA = "report_runtime001", reportB = "report_runtime002", reportDriver = "report_driver001";
export const contributorA = "contributor_person01", contributorB = "contributor_person02";
export const imageConfig = { model: "synthetic-image-review", model_config_hash: "b".repeat(64), prompt_version: "image-review-test-v1" };
export const ports = { scenarioCatalog, simulationPersistence };
/** The actual public factory, not a test implementation of SourceReviewPort. */
export const sourcePort = createSourceReviewPort(ports);
interface Original { participant: Participant; epochs: StoredSourceReport["capturedEpochs"]; receivedAt: string }
/** Read-only compatibility view for assertions; no reviewTestSource namespace exists. */
export interface SourceFixture {
  run: Omit<SimulationRun, "scenario">; reports: Report[]; conflicts: Conflict[];
  originals: Record<string, Original>; images: Record<string, ImageMetadata>;
}
function coverage(run: SimulationRun) {
  const scope = run.scenario.manifest.config.relevant_scope_pairs.map(pair => {
    const current = run.knowledge.find(item => item.segment_id === pair.segment_id && item.vehicle_type === pair.vehicle_type);
    if (!current) throw new Error("Missing genuine current scope");
    return { ...pair, knowledge_epoch: current.knowledge_epoch };
  });
  return { scope, knowledge: run.knowledge, observations: run.sourceSnapshot.observations,
    sources: run.sourceSnapshot.sources, now_sim_minute: run.nowMs / 60000 };
}
export async function loadReviewScenario(id: string, version: string): Promise<SessionSeed> {
  // Callers must request the real current version2; do not reinterpret a version1 session.
  const seed = await loadSessionScenario(id, version), run = simulationPersistence.read(seed.values);
  return { ...seed, entities: { ...seed.entities,
    contributor: [...new Set([...seed.entities.contributor, contributorA, contributorB])] },
    values: { ...seed.values, reviewRewardsSeed: createReviewSeed(coverage(run)) } };
}
/**
 * TEST ARRANGE ONLY: pre-existing canonical M1 receipts, because the frozen submit producer lacks M1 fields.
 * This preserves the real initialized original participant. It does not call/replace a production submit path.
 * A configured policy is explicit test setup; omission captures immutable null, never an implicit seven points.
 */
export async function prepareInstallation(input: Initialization, policy: RewardPolicyRef | null = null, env?: PlatformBindings): Promise<Initialization> {
  const seed = structuredClone(input.seed), run = simulationPersistence.read(seed.values), state = sourceState(seed.values);
  const actor = parseSchema("Participant", input.credentials.record.participant), template = createReportCases().fresh;
  const driver = run.scenario.manifest.initial.drivers.find(item => item.vehicle_type === "motorbike");
  const asset = run.scenario.manifest.config.fixture_assets.find(item => item.fixture_photo_id === template.fixture_photo_id);
  const citizenSource = run.sourceSnapshot.sources.find(item => item.source_type === "community" && item.role === "observation" && item.access_status === "available");
  const driverSource = run.sourceSnapshot.sources.find(item => item.source_type === "driver" && item.role === "observation" && item.access_status === "available");
  if (!driver || !asset || !citizenSource || !driverSource) throw new Error("Genuine version2 driver/community fixture is required");
  if (policy !== null) parseSchema("RewardPolicyRef", policy);
  const at = new Date(Date.parse(run.scenario.manifest.config.t0) + run.nowMs).toISOString();
  for (const binding of [{ id: reportA, entity: contributorA, driver: false }, { id: reportB, entity: contributorB, driver: false },
    { id: reportDriver, entity: driver.driver_id, driver: true }]) {
    const reward = policy === null ? { status: "pending_config", policy: null, reason_code: "POLICY_NOT_CONFIGURED", award_id: null }
      : { status: "pending_review", policy, reason_code: "AWAITING_REVIEW", award_id: null };
    const mediaId = binding.driver ? null : `media_${binding.id}`, uploadId = `upload_${binding.id}`;
    const derivativeKey = `${input.sessionId}/${input.generation}/review-fixture/${binding.id}`;
    if (!binding.driver) {
      if (!env?.REPORT_MEDIA) throw new Error("Missing local normalized-fixture bucket");
      await env.REPORT_MEDIA.put(derivativeKey, syntheticImageBytes());
      const media = parseSchema("Media", { media_id: mediaId, status: "ready", content_type: "image/png", byte_length: asset.byte_length,
        width: asset.width, height: asset.height, sha256: asset.sha256, created_at: at });
      state.uploads[uploadId] = { upload: parseSchema("MediaUpload", { upload_id: uploadId, status: "ready", expires_at: new Date(input.now + 60000).toISOString(),
        maximum_bytes: asset.byte_length, content_path: "/synthetic-test-only" }), ownerId: actor.participant_id, generation: input.generation,
        contentType: "image/png", declaredBytes: asset.byte_length, mediaId: mediaId!, rawBaseKey: derivativeKey + "/raw",
        derivativeBaseKey: derivativeKey, rawKey: "", derivativeKey, rawDigest: null, media,
        activeWriter: null, completedWriters: { raw: null, normalized: null }, duplicate: false };
    }
    const report = parseSchema("Report", { ...template, report_id: binding.id, participant_id: actor.participant_id,
      kind: binding.driver ? "driver" : "citizen", captured_at: at, captured_sim_minute: run.nowMs / 60000, received_at: at,
      fixture_photo_id: null, media_id: mediaId, reporter_entity_id: binding.entity,
      status: "pending_review", reason_codes: [], observation_ids: [], award_id: null, input_revision: 0,
      observation_candidates: [], input_mode: binding.driver ? "quick" : "photo", quick_condition: binding.driver ? "impassable" : null,
      reward, review_result_id: null, reviewed_at: null });
    const capturedEpochs = run.knowledge.filter(pair => pair.segment_id === report.segment_id && report.vehicle_types.includes(pair.vehicle_type))
      .map(({ segment_id, vehicle_type, knowledge_epoch }) => ({ segment_id, vehicle_type, knowledge_epoch }));
    if (capturedEpochs.length !== report.vehicle_types.length) throw new Error("Missing genuine captured epochs");
    state.reports[report.report_id] = { report, originalSubmitter: structuredClone(actor), boundVehicleTypes: [...report.vehicle_types],
      capturedEpochs, sourceId: binding.driver ? driverSource.source_id : citizenSource.source_id,
      generation: input.generation, normalizedDigest: binding.driver ? null : asset.sha256 } satisfies StoredSourceReport;
  }
  return { ...input, seed: { ...seed, values: { ...seed.values, sourcesMedia: state } } };
}
export function fixtureSource(snapshot: Snapshot): SourceFixture {
  const state = sourceState(snapshot.values), records = Object.values(state.reports).filter(item => item.generation === snapshot.meta.generation);
  const participant = records[0]?.originalSubmitter;
  if (!participant) throw new Error("Assertion helper requires an arranged actual original participant");
  const current = sourcePort.read({ snapshot, actor: { participant }, now: Date.now() });
  const { scenario: _scenario, ...run } = simulationPersistence.read(snapshot.values); void _scenario;
  const images: Record<string, ImageMetadata> = {};
  for (const report of current.reports) { const image = sourcePort.image(snapshot, report); if (image) images[report.report_id] = image; }
  return { run, reports: [...current.reports], conflicts: [...current.conflicts], images,
    originals: Object.fromEntries(records.map(record => [record.report.report_id, { participant: record.originalSubmitter,
      epochs: record.capturedEpochs, receivedAt: record.report.received_at }])) };
}
/** Actual simulator advancement and actual Source factory reconciliation; no route entry authority. */
export function advanceFixture(context: TransitionContext, minute: number) {
  const advanced = advanceRun(simulationPersistence.read(context.snapshot.values), minute,
    { authorizeEntry: () => ({ allowed: false, reason: "TEST_NO_ROUTE_AUTHORITY" }) });
  if (!advanced.complete) throw new Error("Bounded actual fixture advancement did not complete");
  const values = simulationPersistence.write(context.snapshot.values, advanced.run);
  const after = { ...context, snapshot: { ...context.snapshot, values, meta: { ...context.snapshot.meta, sim_minute: minute } } };
  const current = sourcePort.read(after);
  return { values: sourcePort.apply(after, { reports: current.reports, observations: current.evidence.observations,
    knowledge: current.knowledge, conflicts: current.conflicts }), simMinute: minute, data: { sim_minute: minute } };
}
/** Exact frozen functional-v2 procedural PNG, not a real photo or normalization/provider proof. */
export function syntheticImageBytes(): Uint8Array {
  return Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAAgklEQVR4nO3PMRGAMBQE0ciJHOrU2MAQIuIgDnBAEwlBwh+a/TA7c+UW98qc17Nz3MFl60u2QwLoQwLoQwLoQwLoQwLoQwLoQwLoQy8BW9uDy9YLoHsBdC+A7gXQvQC6F0D3Auj+L4B69OCy9QLoXgDdC6B7AXQvgO4F0L0Auv88YAG0If2tTU0etAAAAABJRU5ErkJggg=="), character => character.charCodeAt(0));
}
