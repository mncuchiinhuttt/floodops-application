# SimulationData phase03 v2 — SourceEvidence

## Startup acknowledgement
- Work item simulation-data-phase-03-v2, sole SimulationData writer, full owned role scope.
- CWD /Users/vominhlong/seahackathon-worktrees/03-simulation-data; branch feat/floodops-simulation-data.
- Previous clean signed R 3646fa0ac1b837c30a1c3705a7ec9f1f70bfdefe verified; fast-forward merged exact NEW_LAUNCH/observed_launch_sha c17ef2531904f2d94b39e074677cdd212db7d0cc, preserving all history.
- BASE f0c6dc019dc63df89eb8c479de2cd00310123f54; BASE to launch is exactly seven authorized launch metadata files.
- Policy pinned aea042b5fdb5100e826672111f326d3a03847ee7 / b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a.
- Contracts-ready publication 1f2b77e88be0a5ebd1644ad11c3cb5c3bfe5f5ca; index dcfe1d17e95d73295cfa76fa0ac93ec9aaae46df1c7b2c325c79b23a729df82e; all306 artifacts match source d0b6117e925f87cc82de05ca11ecb54253d10f2c and launch. Base/all required gates/previous R verified ancestors.
- Allowed writes packages/simulation, packages/test-fixtures, packages/domain/src/operations, data/scenarios and this exact report. Central protected files excluded; no new server ports.
- Frozen install --ignore-scripts passed (728 packages), Bun1.4.0. No config/lock modifications. Requested model sol/ultra/fast; actual fields not exposed and unverified.
- Remote push/deploy/provider/account/device actions none authorized. Scoped local code/tests/smoke/signed C then report-only R authorized.
- Planned checks: focused simulation/domain/fixture tests, strict typecheck, scoped lint, executable scenario smoke; final canonical ownership and C→R verification.
- Calibration: real D04 source/licence/holdout/tolerances missing, remain incomplete. Known baseline Expo Zod3/deepmerge audit findings remain QA/release blockers; no waiver/forced upgrade.

## Delivery state and source
- Source commits: `0ed2a005130aeb08cf9c05638ac5761557b6cba9` then final source C `cba27340af6c7ab35416e96f4a17b403a1f3c2bb`. Both signatures verified with existing configuration preserved.
- Code ready for integration review. Worker did not publish simulation-ready, phase completion or another gate.
- Source C contains 59 owned changed files from observed launch; report R adds this one evidence file. Existing foundation delivery/history preserved. No manifests/lock/config/contracts/app/other-owner source edited.
- Full scope reachable without external prerequisites is implemented, tested and exercised. Real D04 acquisition/calibration is blocked as detailed below; no calibration or full application completion claim.

## Implemented behavior
- Canonical immutable scenario loader verifies schema, content fingerprints, units/provenance/references, causal ordering, profile coverage/FIFO, geometry/turn/access, initial custody/load/position/duration and source evidence consistency. Resource bounds are explicit operational limits.
- Directed turn-aware routing supports motorbike/car/truck, both only_turn/no_turn and exact constant wire validity windows. No vehicle fallback, window interpolation or fabricated ETA/distance.
- Pure assignment/defer/hub/custody transitions preserve original tier/SLA, reject temporary vector overload and omitted dimensions, and use exact decimal quantity arithmetic with precision failure rather than epsilon bypass.
- Deterministic pickup/travel/service/delivery uses integer milliseconds, actual service boundaries and locked entered-edge duration. Closure/expiry precede new entry; already-entered edges finish and log change. Reroute-only retains frozen initial route until road input/expiry requests rerouting.
- Static/FloodOps/reroute-only share frozen inputs/physics/H with isolated operational state, source/knowledge shared once. Whole/split/resumable advance traces match; fixed pending target cannot change mid-job.
- Candidate projection uses the same physics and input timeline, remains isolated, and computes canonical lexicographic Objective. Separate pure executed transition commits only FloodOps and rejects POL-05 worsening. Route ETA uses the same projection, including service/hub failure, rather than trusting supplied values.
- Runtime source port accepts normalized server-owned knowledge/source snapshot at the existing clock, validates support/registry/epochs/reopening, preserves immutable source facts and frozen bundle, and does not auto-Execute/award. Stale fixture observations cannot overwrite accepted runtime knowledge; newly effective authority is reconciled to a new epoch instead of discarded.
- Observed Metrics derive actual completions at H and distinct road-attempt/order IDs, with proposal/movement breakdown, unfinished/unreachable and baseline-zero null ratios. Hub/load/no-route failures are separate feasibility logs.
- Frozen original synthetic bundle: six nodes, twelve edges, two drivers, three differently sized orders, two explicit-window hubs, 31 observations, source policies, rain/tide context, closures and bike evidence. Procedural PNG/report inputs and T01–T15 input boundary catalog support downstream owners without claiming their implementations pass.

## Actual checks and review
- Frozen install passed:728 packages, lifecycle scripts ignored; Bun1.4.0.
- **55 tests passed,0 failed,4,979 assertions across11 files.** This includes51 scenario/domain/fixture checks plus four runtime producer-port checks. Original18 foundation tests remain passing.
- Package typechecks for simulation/domain/test-fixtures passed. Full explicit strict test typecheck passed; after the last epoch-only delta, simulation package plus changed-test strict typecheck and relevant lint passed again.
- Full scoped ESLint passed. Every owned code/test file is below200 lines; canonical ownership matcher, realpath and staged whitespace checks passed.
- Read-only independent tester/reviewer helpers exercised public package seams and probed unsafe cases. Discovered FIFO/fraction/TTL/conflict/reopening/initial-entry/runtime-epoch defects were fixed with behavior regressions. Latest bounded re-review cleared the final epoch reproducer (closed epoch3); no unresolved reported findings.
- Exact factory draft, explicit seal and frozen JSON matched canonical content/hash. The injected seed is recorded; no stochastic operation consumes a PRNG. No wall-clock or playback-speed field changes physics.
- Earlier failed checks were corrected: schema rejected illustrative aliases; tests moved outside portable domain source under the existing lint config; readonly assertion/strict tuple typing corrected; assertions now use typed operation codes; no safety test or rule was weakened.

Commands (CWD is the worktree root unless stated):

- `bun install --frozen-lockfile --ignore-scripts` — pass.
- `bun test packages/simulation/test packages/test-fixtures/test` — pass.
- `bun --bun run tsc -p packages/simulation/tsconfig.json` — pass.
- `bun --bun run tsc -p packages/domain/tsconfig.json` — pass.
- `bun --bun run tsc -p packages/test-fixtures/tsconfig.json` — pass.
- `bun --bun run tsc --noEmit --strict --noUncheckedIndexedAccess --moduleResolution Bundler --allowImportingTsExtensions --module ESNext --target ES2022 --skipLibCheck --types bun packages/simulation/test/*/*.ts packages/test-fixtures/test/*.ts` — pass.
- `bun --bun run eslint packages/simulation/src packages/simulation/test packages/domain/src/operations packages/test-fixtures/src packages/test-fixtures/test --max-warnings=0` — pass.
- `git diff --cached --check` — pass.
- `git verify-commit 0ed2a005130aeb08cf9c05638ac5761557b6cba9` — pass.
- `git verify-commit cba27340af6c7ab35416e96f4a17b403a1f3c2bb` — pass.

The final delta check also ran:
`bun --bun run tsc -p packages/simulation/tsconfig.json` then explicit strict typecheck of
`packages/simulation/test/movement/knowledge-transition.test.ts` and ESLint for simulation source/that test — pass.

## Actual executable smoke at source C
`bun packages/simulation/test/scenario/scenario-smoke.ts` was executed again at exact C while recording this evidence.
Policy is a deterministic owner-bound test adapter; movement/routes/service/metrics are actual implementation.

```json
{
  "datasetKind": "functional_fixture",
  "calibration": "incomplete",
  "seed": "functional-seed-v1",
  "bundleHash": "42d25cad85adb3e11939b8496469f0b2ba7891003ae89d0be5049dd54fb7ec46",
  "seedHash": "a5ed2d18708f37f1021225af64236140b32f43d19e902558b2f4bb9ebbdc56c9",
  "configHash": "2dfe0b778bab983d5621e07e249203e1fbb3db6f849369e560d7abacd9127f38",
  "graphHash": "a5bf0eb6d7e57bc3f80fd11571cf21d19d870da91d56cac34b62191859f2c86c",
  "route": [
    "seg_edge35",
    "seg_edge33",
    "seg_edge34"
  ],
  "projectedCompletion": 5.75,
  "actualCompletion": 5.75,
  "lockedEdgeAtChange": [
    {
      "branch": "static",
      "segment": "seg_edge17",
      "at": 1
    },
    {
      "branch": "floodops",
      "segment": "seg_edge17",
      "at": 1
    },
    {
      "branch": "reroute_only",
      "segment": "seg_edge17",
      "at": 1
    }
  ],
  "metrics": {
    "static": {
      "critical_late": 1,
      "total_late": 2,
      "total_delay_minutes": 21,
      "blocked_route_attempts": 1,
      "blocked_proposal_attempts": 0,
      "blocked_movement_attempts": 1,
      "orders_reassigned": 0,
      "updated_eta_previews": 0,
      "unfinished_count": 2,
      "unreachable_count": 2,
      "executed_violations": 0
    },
    "floodops": {
      "critical_late": 0,
      "total_late": 1,
      "total_delay_minutes": 8,
      "blocked_route_attempts": 1,
      "blocked_proposal_attempts": 0,
      "blocked_movement_attempts": 1,
      "orders_reassigned": 0,
      "updated_eta_previews": 2,
      "unfinished_count": 1,
      "unreachable_count": 1,
      "executed_violations": 0
    },
    "reroute_only": {
      "critical_late": 0,
      "total_late": 1,
      "total_delay_minutes": 8,
      "blocked_route_attempts": 0,
      "blocked_proposal_attempts": 0,
      "blocked_movement_attempts": 0,
      "orders_reassigned": 0,
      "updated_eta_previews": 0,
      "unfinished_count": 1,
      "unreachable_count": 1,
      "executed_violations": 0
    }
  },
  "finalMinute": 20,
  "originalMinute": 0
}
```
These synthetic raw counts are reproducible functional results only. They are not measured real K1/K2 efficacy, real model output or D04 evidence.

## Frozen hashes
| Input | SHA-256 |
| --- | --- |
| `AGENTS.md` | `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a` |
| `bun.lock` | `8fd61bf2172c41a859459209f9e2b1ae3d5221d5100d4248688d915d8d50fc8d` |
| `tsconfig.base.json` | `35aaa42da6a2d83e94626be0879ed09c3c72303cc3816bb3d987cc9bdfaae081` |
| `eslint.config.js` | `4a76e11925903b3935e0a37dd4b71452ea7bf127f43f034629fd34fad1f233ba` |
| `data/scenarios/functional-v1/manifest.json` | `3c14fcd1b67057028997e4d6ca8de6b9bafeaba710adee6b0448ec40e42cb66f` |
| `data/scenarios/functional-v1/synthetic-report.png` | `1ae5d1b406a5aea5bd6c91a126710100063ad0a96883866c6ced960c3fd027a6` |

## T01–T15 evidence boundary

- **T01:** Actual synthetic scenario/projection/separate pure executed candidate/H metrics; HTTP/manual approval/UI not run.
- **T02/T03:** Hard closure/reopening proofs and vehicle-scoped knowledge tested; contrary report input supplied, no media/review route integration claim.
- **T04:** Expiry/current evidence/runtime stale source behavior tested; API412/approval/CAS belongs platform/planner.
- **T05:** Transient vector load, custody, hub override actual route/pickup/delivery tested; no client E-HUB-01 completion claim.
- **T06:** Unscheduled infeasible orders may wait with null ETA; dependency-group selection belongs PlannerSafety.
- **T07:** Actual synthetic PNG bytes/hash and canonical duplicate/expired drafts tested; normalization/reward exactly-once belongs media/review/platform.
- **T08/T11:** Rain/tide data keeps units/missing or different datum; context events do not change knowledge. Provider ingestion remains downstream.
- **T09:** No model or job controller invoked; PlannerSafety/SessionPlatform own failures/reset fencing.
- **T10:** Fresh run and whole/split/chunk deterministic state/trace tests; session capability/ledger reset remains platform integration.
- **T12:** Accepted current contradiction cannot be hidden; source registry/review-status immutable-fact rules tested. Manual review/reward reducers remain downstream.
- **T13:** Actual closure at entry, already-on-edge lock, next-entry block, expiry and causal completion/entry tested.
- **T14:** Determinism and explicit calibration rejection tested; real source/holdout/tolerance evidence unavailable.
- **T15:** Same-time bike evidence changes projected ETA6.5→5.5; car unchanged and committed state unchanged before separate executed transition. No cross-client/model claim.

## Integration requests
1. IntegrationLead: review/merge the exact report delivery R; run scoped public-package smoke after integration before publishing any qualified simulation-ready receipt. D04/application/security/release remain separate.
2. IntegrationLead: protected packages/simulation/package.json smoke currently invokes foundations only; point full smoke at bun test/scenario/scenario-smoke.ts (optionally retain a separate foundation smoke). Add domain typecheck and fixture test scripts/root CI wiring when composing gates; no new dependency is required.
3. SourcesMedia/ReviewRewards: consume canonical manifest/source fixture data and applyKnowledgeTransition(run, fullKnowledge, {sourceSnapshot,reasonId}) from @floodops/simulation. Preserve immutable source facts/history and registry; only review validation/conflict metadata may change. Supply normalized current knowledge; do not send public raw reports/LLM advice as this trusted port.
4. SessionPlatform/PlannerSafety: bind all pure transitions to server session/generation/revision/latest plan/action, capabilities, CAS/idempotency and atomic storage. authorizeEntry must validate fresh approval scope against prospective vehicle/epoch/evidence/time. Store immutable bundle by version/hash/reference; avoid duplicating graph/config in every persisted event/checkpoint.
5. ResultsEvaluation: consume advanceRun resumable fixed-target checkpoints, branch logs and calculateObservedMetrics at the same H. Projected routes/ETAs are not observed completion. Tests here do not replace Workerd/API/client/model/device acceptance.
6. IntegrationLead/operator: arrange approved real D04 source/licence/independent holdout/tolerance evidence before a new calibrated bundle or real efficacy/release claim. Known Expo Zod3/deepmerge baseline advisories remain QA/security/release blockers.

## Blocked external evidence / limitations
- D04: no approved real road/operational dataset, licence snapshot, independent holdout or precommitted tolerance evidence; all delivered physical/source/media fixtures are simulated/assumed and calibration incomplete. No source acquisition or calibrated success claimed.
- Full T01–T15 application coverage requires downstream SourcesMedia/ReviewRewards/PlannerSafety/SessionPlatform/ResultsEvaluation/web/native integration. Fixture schemas/PNG hashes and pure runtime behavior do not establish media normalization, rewards, API auth/CAS/Reset, model/advisory, device or app E2E acceptance.
- Implementation/local trusted-workspace baseline has known high Expo CLI Zod3.25.76 and low deepmerge4.3.1 findings. No waiver, forced dependency change, QA/security/release gate or deployment authorization claimed.
- Actual requested sol/ultra/fast runtime fields are not exposed to this worker and remain unverified; observed Bun is1.4.0.

No requested owned implementation/check action remains denied, pending permission or uncertain.
D04 and downstream product/security/release evidence remain unavailable/pending their owners; no auto-review denial occurred.
No push, merge into integration/main, deploy, account/resource/key creation, paid/provider/model/device action occurred.
Only the explicitly authorized launch merge and frozen dependency install were performed beyond local owned code/checks/commits.
No secrets, raw personal data or out-of-scope changes were introduced.

## Machine-readable SourceEvidence
```json
{
  "work_item_id": "simulation-data-phase-03-v2",
  "role_id": "simulation-data",
  "base_sha": "f0c6dc019dc63df89eb8c479de2cd00310123f54",
  "observed_launch_sha": "c17ef2531904f2d94b39e074677cdd212db7d0cc",
  "status": "code-ready-for-integration",
  "contract_sha256": "dcfe1d17e95d73295cfa76fa0ac93ec9aaae46df1c7b2c325c79b23a729df82e",
  "changed_paths": [
    "data/scenarios/functional-v1/README.md",
    "data/scenarios/functional-v1/calibration-gaps.md",
    "data/scenarios/functional-v1/manifest.json",
    "data/scenarios/functional-v1/synthetic-report.png",
    "packages/domain/src/operations/assignment.ts",
    "packages/domain/src/operations/decimal-quantity.ts",
    "packages/domain/src/operations/index.ts",
    "packages/domain/src/operations/operation-types.ts",
    "packages/domain/src/operations/quantities.ts",
    "packages/domain/src/operations/validate-operations.ts",
    "packages/domain/src/operations/validate-stops.ts",
    "packages/simulation/README.md",
    "packages/simulation/src/calibration/assess-calibration.ts",
    "packages/simulation/src/graph/create-graph.ts",
    "packages/simulation/src/graph/find-route.ts",
    "packages/simulation/src/graph/graph-types.ts",
    "packages/simulation/src/graph/index.ts",
    "packages/simulation/src/graph/travel-profile.ts",
    "packages/simulation/src/index.ts",
    "packages/simulation/src/metrics/observed-metrics.ts",
    "packages/simulation/src/movement/advance-run.ts",
    "packages/simulation/src/movement/apply-knowledge-transition.ts",
    "packages/simulation/src/movement/create-run.ts",
    "packages/simulation/src/movement/entry-policy.ts",
    "packages/simulation/src/movement/retry-committed-route.ts",
    "packages/simulation/src/movement/route-stops.ts",
    "packages/simulation/src/movement/run-log.ts",
    "packages/simulation/src/movement/run-types.ts",
    "packages/simulation/src/movement/settle-driver.ts",
    "packages/simulation/src/movement/shared-inputs.ts",
    "packages/simulation/src/movement/stop-service.ts",
    "packages/simulation/src/projection/compute-route.ts",
    "packages/simulation/src/projection/execute-candidate.ts",
    "packages/simulation/src/projection/objective.ts",
    "packages/simulation/src/projection/project-candidate.ts",
    "packages/simulation/src/scenario/author-fixture.ts",
    "packages/simulation/src/scenario/fingerprint.ts",
    "packages/simulation/src/scenario/load-scenario.ts",
    "packages/simulation/src/scenario/scenario-types.ts",
    "packages/simulation/src/scenario/validate-knowledge.ts",
    "packages/simulation/src/scenario/validate-manifest.ts",
    "packages/simulation/src/scenario/validate-sources.ts",
    "packages/simulation/src/scenario/wire-graph.ts",
    "packages/simulation/test/metrics/metrics.test.ts",
    "packages/simulation/test/movement/knowledge-transition.test.ts",
    "packages/simulation/test/movement/run.test.ts",
    "packages/simulation/test/operations/operations.test.ts",
    "packages/simulation/test/projection/hub-change.test.ts",
    "packages/simulation/test/scenario/load-scenario.test.ts",
    "packages/simulation/test/scenario/scenario-smoke.ts",
    "packages/simulation/test/scenario/test-context.ts",
    "packages/test-fixtures/src/functional/scenario/catalog.ts",
    "packages/test-fixtures/src/functional/scenario/functional-scenario.ts",
    "packages/test-fixtures/src/functional/scenario/graph-fixture.ts",
    "packages/test-fixtures/src/functional/scenario/operations-fixture.ts",
    "packages/test-fixtures/src/functional/scenario/report-fixtures.ts",
    "packages/test-fixtures/src/functional/scenario/source-fixtures.ts",
    "packages/test-fixtures/src/index.ts",
    "packages/test-fixtures/test/report-fixtures.test.ts",
    "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
  ],
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
    },
    {
      "command": "bun test packages/simulation/test packages/test-fixtures/test",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
    },
    {
      "command": "bun --bun run tsc -p packages/simulation/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
    },
    {
      "command": "bun --bun run tsc -p packages/domain/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
    },
    {
      "command": "bun --bun run tsc -p packages/test-fixtures/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
    },
    {
      "command": "bun --bun run tsc --noEmit --strict --noUncheckedIndexedAccess --moduleResolution Bundler --allowImportingTsExtensions --module ESNext --target ES2022 --skipLibCheck --types bun packages/simulation/test/*/*.ts packages/test-fixtures/test/*.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
    },
    {
      "command": "bun --bun run eslint packages/simulation/src packages/simulation/test packages/domain/src/operations packages/test-fixtures/src packages/test-fixtures/test --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
    },
    {
      "command": "git diff --cached --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
    },
    {
      "command": "git verify-commit 0ed2a005130aeb08cf9c05638ac5761557b6cba9",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
    },
    {
      "command": "git verify-commit cba27340af6c7ab35416e96f4a17b403a1f3c2bb",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
    }
  ],
  "smoke": [
    {
      "scenario": "bun packages/simulation/test/scenario/scenario-smoke.ts",
      "observed_result": "Synthetic closure at1 retains locked edge exit2.25; alternate edge35/33/34 projection5.75 equals actual delivery5.75 after separate executed candidate. H20 static/floodops critical late1/0, total late2/1, delay21/8; executed violations0. Functional counts only, no real efficacy claim.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
    },
    {
      "scenario": "Runtime normalized source transition and stale epoch regression",
      "observed_result": "New E27 bike acceptance changes projected ETA without modifying frozen dataset/committed routes; stale fixture observation skipped; new effective closure survives runtime epoch2 as closed epoch3.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
    },
    {
      "scenario": "Actual alternate-hub route and synthetic media inputs",
      "observed_result": "Canonical route visits hub_beta01 through edge36 then actual pickup/delivery order3 at9.75. Original procedural PNG64x48/187bytes SHA256 matches frozen metadata; canonical fresh/duplicate/expired/conflicting/contrary report inputs parse. No normalization/reward/vision claim.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-phase-03-v2.md"
    }
  ],
  "public_exports": [
    "@floodops/simulation: loadScenario(manifest,hash,options), sealScenarioDraft, canonicalJson/scenarioHashes, assessCalibration; ScenarioManifest/LoadedScenario/SourceSnapshot via manifest types.",
    "@floodops/simulation: createRun(scenario,runId,includeRerouteOnly?), advanceRun(run,targetMinute,policy,{maxBoundaries?}) -> {run,complete,targetMinute}, applyKnowledgeTransition, retryCommittedRoute, checkEntry; SimulationRun/SimulationPolicy/BranchState/RunLog/AdvanceResult types.",
    "@floodops/simulation: computeRoute(run,candidate,driverId,policy,{routeId,inputRevision,hash}) -> canonical Route; projectCandidate/projectCurrent -> canonical Objective + per-order ETAs + isolated candidateRun; applyExecutedCandidate is pure authorized-Executor transition; objectiveFromEtas/compareObjectives.",
    "@floodops/simulation: calculateObservedMetrics(orders,branchLog,H) -> canonical Metrics; relativeReduction(baseline,candidate) -> number|null.",
    "@floodops/simulation/graph and /clock: prior public seams plus canonical truck/constant validity-window support, only_turn compilation and optional prospective-entry filter.",
    "@floodops/domain/operations: OperationState/AssignmentCandidate, validateOperations, applyAssignmentCandidate(state,candidate,pickupServiceMinuteResolver), deferOrder, exact quantity vector helpers, clone/freeze and OperationError.",
    "@floodops/test-fixtures: createFunctionalScenario draft, functionalSources, functionalCatalog T01\u2013T15, createReportCases, syntheticReportAsset, prior createTurnAwareFixture. Root/subpath export maps were Lead-provided; none edited."
  ],
  "integration_requests": [
    "IntegrationLead: review/merge the exact report delivery R; run scoped public-package smoke after integration before publishing any qualified simulation-ready receipt. D04/application/security/release remain separate.",
    "IntegrationLead: protected packages/simulation/package.json smoke currently invokes foundations only; point full smoke at bun test/scenario/scenario-smoke.ts (optionally retain a separate foundation smoke). Add domain typecheck and fixture test scripts/root CI wiring when composing gates; no new dependency is required.",
    "SourcesMedia/ReviewRewards: consume canonical manifest/source fixture data and applyKnowledgeTransition(run, fullKnowledge, {sourceSnapshot,reasonId}) from @floodops/simulation. Preserve immutable source facts/history and registry; only review validation/conflict metadata may change. Supply normalized current knowledge; do not send public raw reports/LLM advice as this trusted port.",
    "SessionPlatform/PlannerSafety: bind all pure transitions to server session/generation/revision/latest plan/action, capabilities, CAS/idempotency and atomic storage. authorizeEntry must validate fresh approval scope against prospective vehicle/epoch/evidence/time. Store immutable bundle by version/hash/reference; avoid duplicating graph/config in every persisted event/checkpoint.",
    "ResultsEvaluation: consume advanceRun resumable fixed-target checkpoints, branch logs and calculateObservedMetrics at the same H. Projected routes/ETAs are not observed completion. Tests here do not replace Workerd/API/client/model/device acceptance.",
    "IntegrationLead/operator: arrange approved real D04 source/licence/independent holdout/tolerance evidence before a new calibrated bundle or real efficacy/release claim. Known Expo Zod3/deepmerge baseline advisories remain QA/security/release blockers."
  ],
  "blocked_prerequisites": [
    "D04: no approved real road/operational dataset, licence snapshot, independent holdout or precommitted tolerance evidence; all delivered physical/source/media fixtures are simulated/assumed and calibration incomplete. No source acquisition or calibrated success claimed.",
    "Full T01\u2013T15 application coverage requires downstream SourcesMedia/ReviewRewards/PlannerSafety/SessionPlatform/ResultsEvaluation/web/native integration. Fixture schemas/PNG hashes and pure runtime behavior do not establish media normalization, rewards, API auth/CAS/Reset, model/advisory, device or app E2E acceptance.",
    "Implementation/local trusted-workspace baseline has known high Expo CLI Zod3.25.76 and low deepmerge4.3.1 findings. No waiver, forced dependency change, QA/security/release gate or deployment authorization claimed.",
    "Actual requested sol/ultra/fast runtime fields are not exposed to this worker and remain unverified; observed Bun is1.4.0."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "cba27340af6c7ab35416e96f4a17b403a1f3c2bb",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```
