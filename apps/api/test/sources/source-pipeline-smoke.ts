import { createFunctionalScenario, createReportCases } from "@floodops/test-fixtures";
import { advanceRun, applyKnowledgeTransition, createRun, loadScenario, sealScenarioDraft } from "@floodops/simulation";
import { proposeReportSubmission } from "../../../../packages/domain/src/reporting/index.ts";
import { proposeObservationAcceptance } from "../../../../packages/domain/src/knowledge/index.ts";
import { participant } from "./test-context.ts";

const hash = (value: string) => new Bun.CryptoHasher("sha256").update(value).digest("hex");
const scenario = loadScenario(sealScenarioDraft(createFunctionalScenario(), hash), hash);
const run = advanceRun(createRun(scenario, "run_sourcessmoke1"), 3, { authorizeEntry: ({ knowledge }) => ({
  allowed: knowledge?.state === "known" && knowledge.confidence_band === "high", reason: "POL-02" }) }).run;
const config = scenario.manifest.config;
const context = { ...run.sourceSnapshot, graph: scenario.manifest.graph, t0: config.t0, nowSimMinute: 3,
  sourceFixtures: config.source_fixtures, profiles: config.source_policy_profiles, parameters: config.parameters, participant: participant(),
  boundVehicleTypes: ["motorbike" as const], dispatcherEntities: [], sourceId: "src_citizen1", reportId: "rpt_sourcessmoke1",
  observationId: "obs_sourcessmoke1", inputRevision: 3, receivedAt: "2026-10-31T00:03:00Z", epochs: run.knowledge,
  fixtureAssets: config.fixture_assets, media: null, reasonId: "smoke-manual-proposal" };
const submitted = proposeReportSubmission(createReportCases().fresh, context);
const accepted = proposeObservationAcceptance(submitted.report, "normal", run.knowledge, { ...context, epochs: submitted.capturedEpochs });
const next = applyKnowledgeTransition(run, accepted.knowledge, { reasonId: context.reasonId,
  sourceSnapshot: { ...run.sourceSnapshot, observations: accepted.observations } });
const unchanged = JSON.stringify(next.branches) === JSON.stringify(run.branches)
  && JSON.stringify(next.scenario) === JSON.stringify(run.scenario) && next.nowMs === run.nowMs;
if (!unchanged || submitted.report.status !== "pending_review" || accepted.report.award_id !== null) throw new Error("Source pipeline smoke failed.");
console.log(JSON.stringify({ dataset: scenario.manifest.datasetKind, calibration: config.scenario.calibration_status,
  bundle_hash: scenario.bundleHash, seed_hash: config.seed_hash, config_hash: config.config_hash, graph_hash: config.graph_hash,
  initial_status: submitted.report.status, proposed_status: accepted.report.status, committed_by_proposal: accepted.committed,
  captured_epochs: submitted.capturedEpochs, award_id: accepted.report.award_id, branch_operations_unchanged: unchanged,
  known_bike: next.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike"),
  car_state: next.knowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "car")?.state,
  closed_pairs: next.knowledge.filter(item => item.state === "authoritative_closed").length }, null, 2));
