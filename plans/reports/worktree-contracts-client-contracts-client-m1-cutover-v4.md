# ContractsClient M1 v4 — SourceEvidence

Source SHA: `1f731d204d9b24e6839787819863c04f1c0f6548`. Status: code-ready-for-integration; Lead owns contracts-ready and coordinated rollout.

## Contract delta

- Contract `0.5.0-m1`, new-session schema `m1-v1`. Before/after: 66→66 operations, 61→61 paths, 194→197 schemas, eight Commander provider registrations→eight internal typed services (seven M1 / one M2 deferral), zero model-callable operational tools.
- Added RewardPolicyRef, ReportReward, DeterministicPlannerMetadata. Changed ErrorCode, Report, ReportReviewResult, Award, PlanningJob, EvaluationInput/Trial/Run; FeatureFlags descriptions mark M2 gates. No schema/operation removed. Auth/CSRF/idempotency/CAS/Reset and all 66 request signatures are unchanged.
- Report requires reward feedback + canonical review identity/time; committed Award binds receipt policy, report/review/contributor and exact unique filled gaps. Missing receipt policy remains pending_config with null award before/after successful manual review; no zero/default points or silent later-policy assignment. Wire helpers validate, they do not grant or evaluate points.
- Planner model selectors replaced with deterministic metadata; NO_FEASIBLE_PLAN is bounded search failure, not global impossibility. PLANNER_TIMEOUT is distinct from photo MODEL_TIMEOUT. Evaluation replay metadata is deterministic. Runtime service implementation remains Planner/Results ownership.
- PRD v0.5 explicitly retains image-quality-v1 rubric/ratings/server-derived advice for M1. Photo DTOs and provider schema unchanged; no unsupported numerical depth/reference fields. Numerical depth, campaign/student/forecast/native are M2, no endpoints added.
- Canonical active source is the authorized plan contract JSON set. Legacy root definition/surface/READMEs are excluded by this amendment, preserved unchanged and no longer M1 authority. Consumer index/docs must use the generated M1 surface.

Active source SHA256: `1fcd71df6aeadc9e8f9c8dbc5041fbdcc2904b4efbca73d137e20a9a883a9f93`.
Active generated surface SHA256: `2b40a7041c41e0792acf69f696dad063b4ab6ac9948adf7a8c780f8e88064eea`.
Photo model schema SHA256 remains `501ee9ad23fd2acea3887c87105fd80a8ca0c2dcb9433e3e6ebf22ae101e01f2`.

New-session cutover only: start/version-select fresh m1-v1 sessions or coordinated Reset, retain legacy sessions/evidence until expiry; never reinterpret old serialized reports/jobs or retro-award. Exact consumer field migration and safe compatibility aliases are documented in `contracts/m1-cutover.md`.

## Actual checks

All commands ran in `/Users/vominhlong/seahackathon-worktrees/01-contracts-client` using Bun 1.4.0.

- `bun install --frozen-lockfile --ignore-scripts` — **pass**: Bun 1.4.0; 927 packages installed; no manifests/lock changes.
- `bun test packages/contracts/test packages/api-client/test` — **pass**: 89 tests / 0 fail / 1024 assertions.
- `bun packages/contracts/scripts/generate.ts --check` — **pass**: 197 schemas / 66 operations / eight internal services / zero model-callable tools.
- `bun run --cwd packages/contracts typecheck` — **pass**: exit 0.
- `bun run --cwd packages/api-client typecheck` — **pass**: exit 0.
- `bun --bun run tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --resolveJsonModule --skipLibCheck --lib ES2022,DOM --types bun packages/contracts/scripts/generate.ts packages/contracts/scripts/operation-codegen.ts packages/contracts/scripts/schema-codegen.ts packages/contracts/scripts/m1-smoke.ts packages/contracts/test/contracts.test.ts packages/contracts/test/image-review.test.ts packages/contracts/test/m1-cutover.test.ts packages/api-client/test/m1-review.test.ts packages/api-client/test/http.test.ts packages/api-client/test/sse-parser.test.ts packages/api-client/test/watch-events.test.ts` — **pass**: generator/test/smoke compatibility exit 0.
- `bun --bun run eslint packages/contracts/src packages/contracts/scripts packages/contracts/test packages/api-client/src packages/api-client/test --max-warnings=0` — **pass**: exit 0.
- `bun build packages/contracts/src/index.ts packages/api-client/src/index.ts --target browser --splitting --outdir /tmp/floodops-contracts-m1-v4-browser` — **pass**: 393 modules, both public portable entrypoints; not a browser interaction test.
- `bun packages/contracts/scripts/m1-smoke.ts` — **pass**: actual executable in-process ApiClient review: accepted + pending_config + award=null; no model registrations; typed NO_FEASIBLE_PLAN.
- `git diff --check` — **pass**: exit 0; all owned TypeScript files <200 lines.
- `ownership matcher assertOwnedPaths plus narrower amendment prefixes and realpath checks over launch diff/untracked and staged source` — **pass**: 43 paths including exact own report; 42 source paths staged; deleted legacy provider registration is owned.
- `raw-byte indexed artifact verification at index.source_commit, receipt base and launch; operation/schema comparison against launch` — **pass**: 721 artifacts matched at all three commits; all 66 operations/request signatures and photo DTOs unchanged.
- `bun --bun run tsc --noEmit -p apps/api/tsconfig.json` — **fail**: 5 existing-baseline consumer compatibility errors; exact list below; no out-of-scope fixes applied.

Independent read-only review reran 89 tests/1024 assertions, both package typechecks, scoped lint and codegen successfully. It found the initial full-envelope-vs-data bug and missing award contributor/gap bindings; fixes and actual ApiClient success/negative regressions are included. No remaining package review blocker.

## Pending rollout / diagnostic failures

The following target action is **pending**, not denied: activate new M1 contracts against legacy API consumers. Reason: coordinated DTO/serialization/runtime migration is outside this worker. Already completed: strict schemas, client validation, aliases, source/surface hashes, tests and smoke.

1. Results `apps/api/src/features/evaluations/pure/aggregate-evaluation.ts:31`: model_config_hash renamed planner_config_hash.
2. Planner `apps/api/src/features/planning/job-leases.ts:28`: MODEL_TIMEOUT must use deterministic PLANNER_TIMEOUT.
3. Planner `apps/api/src/features/planning/job-transitions.ts:33`: same timeout migration.
4. Review `apps/api/src/features/reports/review/state.ts:39`: baseline SOURCE_SCOPE_INCOMPATIBLE comparison TS2367; already separately assigned by Lead.
5. Sources `packages/domain/src/reporting/submit-report.ts:14`: missing required reward/review_result_id/reviewed_at.

Compiler diagnostics do not exhaust runtime serializer migration: old PlanningJob/Award constructors parsed from unknown data must also emit the new fields before mounting. No out-of-scope files were changed to hide these errors. API diagnostic log: `/tmp/floodops-contracts-m1-api-typecheck.log`; focused suite log: `/tmp/floodops-contracts-m1-tests.log`.

No browser interaction, actual backend E2E, private media flow, provider call/vision-quality/device or M1 completion claim. No remote push/deploy/account/resource creation, paid calls, credential/env/state copy or protected file mutation. Model/effort/fast runtime metadata remains unverified.

## SourceEvidence JSON

```json
{
  "work_item_id": "contracts-client-m1-cutover-v4",
  "role_id": "contracts-client",
  "base_sha": "afb8f9c167ce48d8886644af5a8b29899ee1446b",
  "observed_launch_sha": "b686741d5b5273526f5eb5657a290c4df6fde746",
  "status": "code-ready-for-integration",
  "contract_sha256": "e7065b1e2a71db2d58a0dc4f5acf06c77026da1dee990c2678785589909b6777",
  "source_sha": "1f731d204d9b24e6839787819863c04f1c0f6548",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a",
  "changed_paths": [
    "packages/api-client/src/http/response.ts",
    "packages/api-client/test/m1-review.test.ts",
    "packages/contracts/scripts/definition-types.ts",
    "packages/contracts/scripts/generate.ts",
    "packages/contracts/scripts/m1-smoke.ts",
    "packages/contracts/src/catalog.ts",
    "packages/contracts/src/generated/contract-surface.json",
    "packages/contracts/src/generated/internal-services.json",
    "packages/contracts/src/generated/provider-tools.json",
    "packages/contracts/src/generated/schemas.ts",
    "packages/contracts/src/generated/schemas/award.ts",
    "packages/contracts/src/generated/schemas/deterministic-planner-metadata.ts",
    "packages/contracts/src/generated/schemas/error-code.ts",
    "packages/contracts/src/generated/schemas/evaluation-input.ts",
    "packages/contracts/src/generated/schemas/evaluation-run.ts",
    "packages/contracts/src/generated/schemas/evaluation-trial.ts",
    "packages/contracts/src/generated/schemas/feature-flags.ts",
    "packages/contracts/src/generated/schemas/planning-job.ts",
    "packages/contracts/src/generated/schemas/report-review-result.ts",
    "packages/contracts/src/generated/schemas/report-reward.ts",
    "packages/contracts/src/generated/schemas/report.ts",
    "packages/contracts/src/generated/schemas/reward-policy-ref.ts",
    "packages/contracts/src/generated/tools/compute-route.ts",
    "packages/contracts/src/generated/tools/draft-customer-notification.ts",
    "packages/contracts/src/generated/tools/get-affected-orders.ts",
    "packages/contracts/src/generated/tools/get-incident-state.ts",
    "packages/contracts/src/generated/tools/propose-assignment-change.ts",
    "packages/contracts/src/generated/tools/propose-order-deferral.ts",
    "packages/contracts/src/generated/tools/record-road-observation.ts",
    "packages/contracts/src/generated/tools/test-reassignment.ts",
    "packages/contracts/src/generated/version.ts",
    "packages/contracts/src/index.ts",
    "packages/contracts/src/m1-rewards.ts",
    "packages/contracts/src/tool-definitions.ts",
    "packages/contracts/test/contracts.test.ts",
    "packages/contracts/test/m1-cutover.test.ts",
    "plans/20261030-2249-floodops-web-mobile-implementation/contracts/api-index.md",
    "plans/20261030-2249-floodops-web-mobile-implementation/contracts/contract-examples.json",
    "plans/20261030-2249-floodops-web-mobile-implementation/contracts/m1-cutover.md",
    "plans/20261030-2249-floodops-web-mobile-implementation/contracts/openapi.json",
    "plans/20261030-2249-floodops-web-mobile-implementation/contracts/tool-contracts.json",
    "plans/20261030-2249-floodops-web-mobile-implementation/contracts/tool-contracts.md"
  ],
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-m1-cutover-v4.md"
    },
    {
      "command": "bun test packages/contracts/test packages/api-client/test",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-m1-cutover-v4.md"
    },
    {
      "command": "bun packages/contracts/scripts/generate.ts --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-m1-cutover-v4.md"
    },
    {
      "command": "bun run --cwd packages/contracts typecheck",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-m1-cutover-v4.md"
    },
    {
      "command": "bun run --cwd packages/api-client typecheck",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-m1-cutover-v4.md"
    },
    {
      "command": "bun --bun run tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --resolveJsonModule --skipLibCheck --lib ES2022,DOM --types bun packages/contracts/scripts/generate.ts packages/contracts/scripts/operation-codegen.ts packages/contracts/scripts/schema-codegen.ts packages/contracts/scripts/m1-smoke.ts packages/contracts/test/contracts.test.ts packages/contracts/test/image-review.test.ts packages/contracts/test/m1-cutover.test.ts packages/api-client/test/m1-review.test.ts packages/api-client/test/http.test.ts packages/api-client/test/sse-parser.test.ts packages/api-client/test/watch-events.test.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-m1-cutover-v4.md"
    },
    {
      "command": "bun --bun run eslint packages/contracts/src packages/contracts/scripts packages/contracts/test packages/api-client/src packages/api-client/test --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-m1-cutover-v4.md"
    },
    {
      "command": "bun build packages/contracts/src/index.ts packages/api-client/src/index.ts --target browser --splitting --outdir /tmp/floodops-contracts-m1-v4-browser",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-m1-cutover-v4.md"
    },
    {
      "command": "bun packages/contracts/scripts/m1-smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-m1-cutover-v4.md"
    },
    {
      "command": "git diff --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-m1-cutover-v4.md"
    },
    {
      "command": "ownership matcher assertOwnedPaths plus narrower amendment prefixes and realpath checks over launch diff/untracked and staged source",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-m1-cutover-v4.md"
    },
    {
      "command": "raw-byte indexed artifact verification at index.source_commit, receipt base and launch; operation/schema comparison against launch",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-m1-cutover-v4.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "fail",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-m1-cutover-v4.md"
    }
  ],
  "smoke": [
    {
      "scenario": "M1 executable portable client/strict planner smoke with synthetic in-process transport",
      "observed_result": "accepted manual review + pending_config + null award; zero model-callable tools; typed bounded NO_FEASIBLE_PLAN",
      "result": "pass",
      "evidence_path": "packages/contracts/scripts/m1-smoke.ts"
    }
  ],
  "public_exports": [
    "Existing schema/DTO and HTTP operation exports preserved except explicitly changed M1 response fields; 66 operationId/method/path/request signatures unchanged.",
    "RewardPolicyRef, ReportReward, DeterministicPlannerMetadata; parseM1ReviewResult and assertReceiptRewardPolicyUnchanged.",
    "internalServices, InternalServiceName/Input/Output, parseInternalServiceInput/Output, getInternalServiceDefinitions; historical tools/Tool* parsing aliases retained.",
    "Deprecated getToolDefinitions export remains but always throws RuntimeCommanderDisabledError; generated provider-tools.json removed.",
    "Photo ModelOutput/getImageReviewModelOutputSchema/image-quality-v1 unchanged; public client review response validates envelope.data identity and preserves envelope.",
    "Active generated M1 surface: packages/contracts/src/generated/contract-surface.json"
  ],
  "integration_requests": [
    "Lead review/merge exact delivery and publish fresh M1 contracts-ready/consumer receipts; do not mount new response validators onto legacy producers.",
    "Sources: pin nullable receipt reward policy and emit Report.reward/review_result_id/reviewed_at; no later null-policy backfill. Review: atomic canonical review result and committed award policy/contributor/gap binding, pending_config independent of knowledge/manual review.",
    "Planner: emit PlanningJob.planner(kind,algorithm_version,64hex config_hash,explicit positive search_limit candidate evaluations); replace model timeout with PLANNER_TIMEOUT, bounded infeasibility with NO_FEASIBLE_PLAN; remove runtime Commander calls.",
    "Results: EvaluationInput/Run kind deterministic_replay, EvaluationTrial.planner_config_hash, is_real_model=false. Session: version-select new sessions m1-v1; isolate/expire old sessions, no speculative migration.",
    "Lead repoint frozen consumer index/docs to packages/contracts/src/generated/contract-surface.json. Root definition/contract-surface/READMEs are excluded by narrow amendment and preserved historical snapshots; they are not active M1 inputs.",
    "Reward numeric policy and per-report/per-gap interpretation remain explicitly unspecified until a pinned config is actually supplied; do not invent defaults or retro-awards. M1 flags for defer/hub/reroute-only remain false."
  ],
  "blocked_prerequisites": [
    "Pending coordinated producer/client/new-session rollout. The current frozen baseline API consumer typecheck fails at five locations listed below; no full M1 application or E2E gate is claimed."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false
}
```

## Startup acknowledgement

Work item contracts-client-m1-cutover-v4, same sole writer, feat/floodops-contracts-client. Clean prior delivery b59ecdd821ac4e6504a569347dc8e44decdfabd9 fast-forwarded to exact observed launch b686741d5b5273526f5eb5657a290c4df6fde746. Base afb8f9c167ce48d8886644af5a8b29899ee1446b and both prerequisite gates verified ancestors.
Policy SHA256 b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a unchanged. Receipt input index e7065b1e2a71db2d58a0dc4f5acf06c77026da1dee990c2678785589909b6777 and every indexed artifact verified at base. Base→launch is approved metadata only.
Allowed writes are amendment prefixes contracts src/test/scripts, api-client src/test, plan contracts, and this exact report; no central/protected files, root package artifacts, deployment/push/account/provider/credentials actions. Bun 1.4.0 frozen install --ignore-scripts succeeded locally, 927 packages.
The narrower amendment excludes root definition/surface/README and api-client scripts. Canonical M1 source is now the authorized plan contract JSON set; generator publishes M1 surface under src/generated. Historical root snapshots are preserved unchanged and no longer authoritative for M1.
PRD v0.5 still retains image-quality-v1 rubric for M1; numerical depth is M2, no unsupported depth fields added. Planned checks: source/generated parity, strict reward and deterministic service/planner behavior, existing client regression tests, typechecks/lint, portable bundle, executable smoke and scope. Actual runtime model/effort/tier metadata unavailable.
