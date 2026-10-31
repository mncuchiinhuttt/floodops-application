/// <reference types="@cloudflare/workers-types" />
import { describe, expect, mock, test } from "bun:test";
import { parseSchema } from "@floodops/contracts";
import type { ReportReward, RewardPolicyRef } from "@floodops/contracts";
import { proposeObservationAcceptance } from "@floodops/domain/knowledge";
import { proposeReportSubmission, submitReport } from "@floodops/domain/reporting";
import { createReportCases, syntheticReportAsset } from "@floodops/test-fixtures";
import { advanceRun } from "@floodops/simulation";
import type { TransitionContext } from "../../src/shared/index.ts";
import type { SourcesPorts } from "../../src/features/scenario/index.ts";
import { driverContext, reportContext } from "./test-context.ts";

// Loader shim only; no DO is instantiated and no Review runtime is mocked or executed.
mock.module("cloudflare:workers", () => ({ DurableObject: class {} }));
const { scenarioCatalog, simulationPersistence, loadSessionScenario } = await import("../../src/index.ts");
const { createSourcesFeature } = await import("../../src/features/sources/index.ts");
const { createSourceReviewPort } = await import("../../src/features/reports/index.ts");
type Provider = NonNullable<SourcesPorts["receiptRewardPolicy"]>;
const policy = (): RewardPolicyRef => ({ policy_id: "policy_receipt1", version: "synthetic-v1", config_hash: "a".repeat(64) });
const missing: ReportReward = { status: "pending_config", policy: null, reason_code: "POLICY_NOT_CONFIGURED", award_id: null };
const driverText = () => ({ ...createReportCases().conflictingDriver, input_mode: "text" as const, quick_condition: null });
async function received(receiptRewardPolicy?: Provider) {
  const scenario = scenarioCatalog.list()[0]!, config = scenario.manifest.config;
  const seed = await loadSessionScenario(config.scenario.scenario_id, config.scenario.version);
  const run = advanceRun(simulationPersistence.read(seed.values), 3, {
    authorizeEntry: () => ({ allowed: false, reason: "Explicit receipt-policy unit fixture" }),
  }).run;
  const now = Date.parse(config.t0) + 180_000;
  const ports: SourcesPorts = { scenarioCatalog, simulationPersistence, ...(receiptRewardPolicy ? { receiptRewardPolicy } : {}) };
  const source = createSourceReviewPort(ports), feature = createSourcesFeature(ports);
  const participant = parseSchema("Participant", { participant_id: "participant_receipt1", role: "contributor",
    bound_entity_id: "contributor_functional1", expires_at: new Date(now + 3_600_000).toISOString(), is_owner: false,
    permissions: ["session:read", "reports:submit", "media:read", "media:write"] });
  const context: TransitionContext = { now, actor: { participant }, snapshot: {
    meta: parseSchema("SessionMeta", { session_id: "session_receipt1", generation: 0, revision: 4, event_sequence: 8,
      scenario_id: seed.scenario_id, scenario_version: seed.scenario_version, sim_minute: 3, horizon_minute: seed.horizon_minute,
      status: "active", calibration_status: seed.calibration_status, created_at: config.t0, expires_at: participant.expires_at }),
    values: simulationPersistence.write(seed.values, run), seed, absoluteExpiry: now + 86_400_000, pointers: {}, leases: {},
  } };
  const command = feature.registry.commands?.["source-submit-report"];
  if (!command) throw new Error("Actual Sources submission command required");
  // Trusted synthetic digest input to this pure reducer; actual normalization is covered by Workerd tests.
  const submitted = command.reduce(context, command.validate({ input: createReportCases().fresh,
    reportId: "report_receipt1", fixtureDigest: syntheticReportAsset.sha256 }));
  const reviewer = parseSchema("Participant", { participant_id: "participant_reviewer1", role: "dispatcher", bound_entity_id: null,
    expires_at: participant.expires_at, is_owner: true, permissions: ["session:read", "reports:review", "knowledge:resolve"] });
  const reviewedContext = { ...context, actor: { participant: reviewer }, snapshot: { ...context.snapshot, values: submitted.values! } };
  const report = source.report(reviewedContext.snapshot, "report_receipt1");
  if (!report) throw new Error("Actual submitted report required");
  return { source, context: reviewedContext, report };
}
describe("M1 receipt-owned reward policy", () => {
  test("actual source proposal can commit manual knowledge without a configured reward policy", async () => {
    const { source, context, report } = await received(), before = structuredClone(context.snapshot), state = source.read(context);
    const proposal = proposeObservationAcceptance(report, "normal", state.pairs, { ...source.reportContext(context, report), ...state.evidence,
      observationIds: [{ vehicle_type: "motorbike", observation_id: "obs_receipthuman01" }], reasonId: "review_receipthuman01" });
    // Explicit human-result fixture finalizes a pure proposal; this does not simulate an HTTP Review success.
    const accepted = parseSchema("Report", { ...proposal.report, review_result_id: "review_receipthuman01", reviewed_at: new Date(context.now).toISOString() });
    const values = source.apply(context, { reports: [accepted], observations: proposal.observations, knowledge: proposal.knowledge, conflicts: state.conflicts });
    const stored = source.report({ ...context.snapshot, values }, report.report_id)!;
    expect(stored.status).toBe("accepted"); expect(stored.reward).toEqual(missing); expect(stored.award_id).toBeNull();
    expect(simulationPersistence.read(values).sourceSnapshot.observations.some(item => item.observation_id === "obs_receipthuman01" && item.validation === "accepted")).toBe(true);
    expect(values.reviewRewards).toBeUndefined(); expect(context.snapshot).toEqual(before);
  });
  test("missing config produces pending_config rather than an error or zero award", () => {
    const submission = proposeReportSubmission(createReportCases().fresh, reportContext());
    expect(submission.report.reward).toEqual(missing);
    expect(submission.report.award_id).toBeNull();
    expect(submission.report.status).toBe("pending_review");
    expect(submission.capturedEpochs.length).toBeGreaterThan(0);
  });
  test("configured citizen policy is cloned and remains pinned when the caller changes its config object", () => {
    const mutable = policy(), pinned = structuredClone(mutable);
    const report = submitReport(createReportCases().fresh, { ...reportContext(), receiptRewardPolicy: mutable });
    mutable.version = "synthetic-v2"; mutable.config_hash = "b".repeat(64);
    expect(report.reward).toEqual({ status: "pending_review", policy: pinned, reason_code: "AWAITING_REVIEW", award_id: null });
    expect(report.reward.policy).not.toBe(mutable);
  });
  test.each([null, policy()])("driver receipt has no community award authority: %p", receiptRewardPolicy => {
    const report = submitReport(driverText(), { ...driverContext(), receiptRewardPolicy });
    expect(report.reward).toEqual(receiptRewardPolicy
      ? { status: "ineligible", policy: receiptRewardPolicy, reason_code: "NOT_ELIGIBLE", award_id: null } : missing);
    expect(report.award_id).toBeNull();
  });
  test.each(["citizen", "driver"] as const)("%s submission has no fabricated human-review identity", kind => {
    for (const receiptRewardPolicy of [null, policy()]) {
      const report = kind === "citizen" ? submitReport(createReportCases().fresh, { ...reportContext(), receiptRewardPolicy })
        : submitReport(driverText(), { ...driverContext(), receiptRewardPolicy });
      expect(report.review_result_id).toBeNull(); expect(report.reviewed_at).toBeNull();
      expect(parseSchema("Report", report)).toEqual(report);
    }
  });
  test.each(["reward", "receiptRewardPolicy", "review_result_id", "reviewed_at", "award_id", "policy_id", "points"])("client cannot set %s", field => {
    expect(() => submitReport({ ...createReportCases().fresh, [field]: policy() }, reportContext())).toThrow("INVALID_SCHEMA");
  });
  test("provider receives the authenticated receipt context and its mutable result is not retained", async () => {
    const mutable = policy(), pinned = structuredClone(mutable);
    let seen: Parameters<Provider>[0] | undefined;
    const fixture = await received(context => { seen = structuredClone(context); return mutable; });
    expect(seen).toEqual({ sessionId: fixture.context.snapshot.meta.session_id, generation: 0,
      scenarioId: fixture.context.snapshot.meta.scenario_id, scenarioVersion: fixture.context.snapshot.meta.scenario_version,
      receivedAt: fixture.report.received_at, kind: "citizen" });
    mutable.version = "synthetic-v2"; mutable.config_hash = "c".repeat(64);
    expect(fixture.source.report(fixture.context.snapshot, fixture.report.report_id)?.reward.policy).toEqual(pinned);
  });
  test.each(["policy_id", "version", "config_hash"] as const)("adapter rejects configured receipt %s replacement", async field => {
    const pinned = policy(), fixture = await received(() => pinned), { source, context, report } = fixture;
    const before = structuredClone(context.snapshot), current = source.read(context);
    const replacement = { ...pinned, [field]: field === "config_hash" ? "d".repeat(64) : field === "policy_id" ? "policy_other001" : "synthetic-v2" };
    const changed = parseSchema("Report", { ...report, reward: { ...report.reward, policy: replacement } });
    expect(() => source.apply(context, { reports: [changed], observations: current.evidence.observations,
      knowledge: current.knowledge, conflicts: current.conflicts })).toThrow();
    expect(context.snapshot).toEqual(before);
    expect(source.report(context.snapshot, report.report_id)?.reward.policy).toEqual(pinned);
  });
  test("later config cannot upgrade a null receipt through reportContext or a proposed human decision", async () => {
    let latest: RewardPolicyRef | null = null, calls = 0;
    const fixture = await received(() => { calls++; return latest; });
    const { source, context, report } = fixture, callsAtReceipt = calls;
    expect(report.reward).toEqual(missing);
    latest = policy();
    expect(source.reportContext(context, report).receiptRewardPolicy).toBeNull();
    expect(calls).toBe(callsAtReceipt);
    const current = source.read(context);
    // Explicit human rejection fixture, only a proposed values result: no fake Review/award runtime.
    const rejected = parseSchema("Report", { ...report, status: "rejected", review_result_id: "review_human001",
      reviewed_at: new Date(context.now).toISOString() });
    const change = { reports: [rejected], observations: current.evidence.observations, knowledge: current.knowledge, conflicts: current.conflicts };
    const values = source.apply(context, change), nextContext = { ...context, snapshot: { ...context.snapshot, values } };
    expect(source.report(nextContext.snapshot, report.report_id)?.reward).toEqual(missing);
    expect(simulationPersistence.read(values)).toEqual(simulationPersistence.read(context.snapshot.values));
    const configured = parseSchema("Report", { ...rejected,
      reward: { status: "ineligible", policy: latest, reason_code: "NOT_ELIGIBLE", award_id: null } });
    expect(() => source.apply(nextContext, { ...change, reports: [configured] })).toThrow();
    expect(source.report(nextContext.snapshot, report.report_id)?.reward).toEqual(missing);
    expect(calls).toBe(callsAtReceipt);
  });
});
