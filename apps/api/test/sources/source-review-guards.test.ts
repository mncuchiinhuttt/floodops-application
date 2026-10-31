/// <reference types="@cloudflare/workers-types" />
import { describe, expect, mock, test } from "bun:test";
import { parseSchema } from "@floodops/contracts";
import type { Report } from "@floodops/contracts";
import { createReportCases } from "@floodops/test-fixtures";
import { advanceRun } from "@floodops/simulation";
import { sourceState } from "@floodops/domain/reporting";
import type { TransitionContext } from "../../src/shared/index.ts";
import type { ReviewStore, SourceReviewPort } from "../../src/features/reports/review/index.ts";

// Loader shim only: these tests never construct a DO, dispatch RPC, or claim platform coverage.
// Every report below comes from the actual Sources feature command reducer.
mock.module("cloudflare:workers", () => ({ DurableObject: class {}, env: {} }));
// Load after the shim so Bun resolves the Worker-only module boundary.
const { createReviewRuntime } = await import("../../src/features/reports/review/index.ts");
const { scenarioCatalog, simulationPersistence, loadSessionScenario } = await import("../../src/index.ts");
const { createSourcesFeature } = await import("../../src/features/sources/index.ts");
const { createSourceReviewPort } = await import("../../src/features/reports/index.ts");
const ports = { scenarioCatalog, simulationPersistence };
const feature = createSourcesFeature(ports), source = createSourceReviewPort(ports);
type Change = Parameters<SourceReviewPort["apply"]>[1];
function command(context: TransitionContext, name: string, payload: unknown): TransitionContext {
  const definition = feature.registry.commands?.[name];
  if (!definition) throw new Error(`Missing genuine Sources command ${name}`);
  const proposed = definition.reduce(context, definition.validate(payload));
  return { ...context, snapshot: { ...context.snapshot, values: proposed.values ?? context.snapshot.values } };
}
async function submitted(mode: "text" | "quick" = "text"): Promise<TransitionContext> {
  const scenario = scenarioCatalog.list()[0]!, config = scenario.manifest.config;
  const seed = await loadSessionScenario(config.scenario.scenario_id, config.scenario.version);
  const run = advanceRun(simulationPersistence.read(seed.values), 3, {
    authorizeEntry: () => ({ allowed: false, reason: "Explicit pure guard-test policy" }),
  }).run;
  const now = Date.parse(config.t0) + 180_000;
  const driver = scenario.manifest.initial.drivers.find(item => item.vehicle_type === "motorbike");
  if (!driver) throw new Error("Canonical driver-ready scenario required");
  const participant = parseSchema("Participant", { participant_id: "participant_driver1", role: "driver",
    bound_entity_id: driver.driver_id, expires_at: new Date(now + 3_600_000).toISOString(), is_owner: false,
    permissions: ["session:read", "reports:submit", "media:write", "media:read"] });
  const context: TransitionContext = { now, actor: { participant }, snapshot: {
    meta: parseSchema("SessionMeta", { session_id: "session_guard001", generation: 0, revision: 4, event_sequence: 8,
      scenario_id: seed.scenario_id, scenario_version: seed.scenario_version, sim_minute: 3, horizon_minute: seed.horizon_minute,
      status: "active", calibration_status: seed.calibration_status, created_at: config.t0, expires_at: participant.expires_at }),
    values: simulationPersistence.write(seed.values, run), seed, absoluteExpiry: now + 86_400_000,
    pointers: { latest_plan_id: "plan_guard001", latest_requested_job_id: null }, leases: {},
  } };
  const input = { ...createReportCases().conflictingDriver, input_mode: mode,
    quick_condition: mode === "quick" ? "impassable" as const : null };
  const proposed = command(context, "source-submit-report", { input, reportId: "report_guard001", fixtureDigest: null });
  const report = source.report(proposed.snapshot, "report_guard001");
  expect(report?.status).toBe(mode === "quick" ? "pending_review" : "needs_clarification");
  if (mode === "quick") {
    expect(report?.review_result_id).toBeNull(); expect(report?.reviewed_at).toBeNull();
    expect(report?.observation_ids).toEqual([]); expect(report?.award_id).toBeNull();
    const afterSubmit = simulationPersistence.read(proposed.snapshot.values);
    expect(afterSubmit.knowledge).toEqual(run.knowledge);
    expect(afterSubmit.sourceSnapshot.observations).toEqual(run.sourceSnapshot.observations);
  }
  return { ...proposed, actor: { participant: parseSchema("Participant", { participant_id: "participant_review1", role: "dispatcher",
    bound_entity_id: null, expires_at: participant.expires_at, is_owner: true,
    permissions: ["session:read", "reports:review", "knowledge:resolve", "media:write", "media:read"] }) } };
}
function changeOf(context: TransitionContext): Change {
  const current = source.read(context);
  return { reports: structuredClone([...current.reports]), knowledge: structuredClone([...current.knowledge]),
    observations: structuredClone([...current.evidence.observations]), conflicts: structuredClone([...current.conflicts]) };
}
const immutableChanges: Partial<Report>[] = [
  { report_id: "report_forged01" }, { participant_id: "participant_forged1" }, { reporter_entity_id: "driver_forged01" },
  { kind: "citizen" }, { input_mode: "photo" }, { description: "Rewritten submitted evidence" },
  { captured_at: "2026-10-31T00:04:00Z" }, { captured_sim_minute: 4 },
  { received_at: "2026-10-31T00:04:00Z" }, { input_revision: 5 },
  { media_id: "media_forged01" }, { fixture_photo_id: "photo_forged01" },
];
describe("canonical Sources review persistence guards", () => {
  test.each(immutableChanges)("rejects modified receipt facts %p without mutation", async mutation => {
    const context = await submitted(), before = structuredClone(context.snapshot), change = changeOf(context);
    change.reports = change.reports.map(report => ({ ...report, ...mutation }));
    expect(() => source.apply(context, change)).toThrow();
    expect(context.snapshot).toEqual(before);
  });
  test.each(["missing", "duplicate", "epoch", "foreign"] as const)("rejects forged authoritative pair set: %s", async mode => {
    const context = await submitted(), before = structuredClone(context.snapshot), change = changeOf(context);
    const knowledge = [...change.knowledge];
    if (mode === "missing") knowledge.pop();
    if (mode === "duplicate") knowledge[0] = structuredClone(knowledge[1]!);
    if (mode === "epoch") knowledge[0] = { ...knowledge[0]!, knowledge_epoch: knowledge[0]!.knowledge_epoch + 1 };
    if (mode === "foreign") knowledge[0] = { ...knowledge[0]!, segment_id: "segment_forged01" };
    expect(() => source.apply(context, { ...change, knowledge })).toThrow("STATE_CONFLICT");
    expect(context.snapshot).toEqual(before);
  });
  test("manual review creates stable conflicts from a genuine quick report", async () => {
    const pending = await submitted("quick"), runtime = createReviewRuntime({ source });
    const accept = runtime.registry.commands?.["review:accept"];
    if (!accept) throw new Error("Actual Review acceptance command required");
    const transition = accept.reduce(pending, accept.validate({ report_id: "report_guard001", input: {
      decision: "accept", reason: "Manual review required after quick submission", mapped_segment_id: "seg_edge27",
      vehicle_types: ["motorbike"], condition: "impassable",
    } }));
    if (!transition.values) throw new Error("Actual Review acceptance values required");
    const context = { ...pending, snapshot: { ...pending.snapshot, values: transition.values } };
    const reviewed = source.report(context.snapshot, "report_guard001");
    expect(reviewed?.status).toBe("accepted");
    expect(reviewed?.review_result_id).toBeTruthy(); expect(reviewed?.reviewed_at).toBeTruthy();
    expect(reviewed?.observation_ids).toHaveLength(1); expect(reviewed?.award_id).toBeNull();
    const store = context.snapshot.values.reviewRewards as ReviewStore | undefined;
    expect(store?.ledger.awards).toEqual([]);
    const before = structuredClone(context.snapshot), first = source.read(context), second = source.read(context);
    const conflict = first.conflicts.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike");
    expect(conflict).toBeDefined();
    expect(conflict?.status).toBe("unresolved");
    expect(conflict?.observation_ids.length).toBeGreaterThanOrEqual(2);
    expect(second.conflicts).toEqual(first.conflicts);
    expect(context.snapshot).toEqual(before);
    const values = source.apply(context, changeOf(context));
    expect(source.read({ ...context, snapshot: { ...context.snapshot, values } }).conflicts).toEqual(first.conflicts);
  });
  test("metadata review preserves real writer/source metadata and unrelated feature state", async () => {
    let context = await submitted();
    const asset = scenarioCatalog.list()[0]!.manifest.config.fixture_assets[0]!;
    context = command(context, "media-reserve", { input: { content_type: asset.content_type, byte_length: asset.byte_length,
      original_filename: "synthetic-guard.png" }, uploadId: "upload_guard001", mediaId: "media_guard001" });
    context = command(context, "media-begin", { uploadId: "upload_guard001", attemptId: "attempt_guard001", kind: "raw", digest: asset.sha256 });
    const upload = sourceState(context.snapshot.values).uploads.upload_guard001!;
    context = command(context, "media-track", { ticket: { recoveryId: "writer_guard001", writerId: "writer_guard001", attemptId: "attempt_guard001",
      sessionId: context.snapshot.meta.session_id, generation: context.snapshot.meta.generation, uploadId: upload.upload.upload_id,
      kind: "raw", key: `${upload.rawBaseKey}/writer_guard001`, writeDeadline: context.now + 59_000, retainUntil: context.snapshot.absoluteExpiry } });
    context = { ...context, snapshot: { ...context.snapshot,
      values: { ...context.snapshot.values, otherFeature: { version: 7, nested: { preserve: ["value"] } } } } };
    const before = structuredClone(context.snapshot), state = sourceState(before.values), run = simulationPersistence.read(before.values);
    expect(state.uploads.upload_guard001?.activeWriter?.id).toBe("writer_guard001");
    const change = changeOf(context);
    change.reports = change.reports.map(report => ({ ...report, status: "rejected" as const, review_result_id: "review_guardhuman001", reviewed_at: new Date(context.now).toISOString() }));
    const values = source.apply(context, change), after = sourceState(values);
    expect(values.otherFeature).toEqual(before.values.otherFeature);
    expect(after.uploads).toEqual(state.uploads);
    expect(after.epochHistory).toEqual(state.epochHistory);
    expect(after.replayedFixtureIds).toEqual(state.replayedFixtureIds);
    const { report: _originalReport, ...originalReceipt } = state.reports.report_guard001!;
    const { report: updatedReport, ...updatedReceipt } = after.reports.report_guard001!;
    void _originalReport;
    expect(updatedReceipt).toEqual(originalReceipt);
    expect(updatedReport.status).toBe("rejected");
    expect(simulationPersistence.read(values)).toEqual(run);
    expect(context.snapshot).toEqual(before);
  });
  test("report-only change adds no Simulation input log, sequence, or physical state", async () => {
    const context = await submitted(), before = simulationPersistence.read(context.snapshot.values), change = changeOf(context);
    change.reports = change.reports.map(report => ({ ...report, status: "rejected" as const, review_result_id: "review_guardhuman001", reviewed_at: new Date(context.now).toISOString() }));
    const values = source.apply(context, change), after = simulationPersistence.read(values);
    expect(source.report({ ...context.snapshot, values }, "report_guard001")?.status).toBe("rejected");
    expect(after.log).toEqual(before.log);
    expect(after.nextSequence).toBe(before.nextSequence);
    expect(after.nowMs).toBe(before.nowMs);
    expect(after.branches).toEqual(before.branches);
    expect(after.sourceSnapshot).toEqual(before.sourceSnapshot);
  });
});
