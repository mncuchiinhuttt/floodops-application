# ReviewRewards M1 receipt policy and runtime wiring v5

Source C: `0fbf27784762b74aad3225d9fb2c708bc28cbc31` (signed, good ED25519). Branch `feat/floodops-review-rewards`; exact launch `c30dd59defde31e222e4a52416ad3e6f553d0bb0`; base `2a440311b4a8a78f1dc3303e7aa9c8c35d097f40`. Status: **blocked on the Source M1 serializer/apply amendment**, with the bounded Review implementation ready for integration. No remote push/deploy/provider call occurred.

Manual decisions now receive server review identity/time. Awards bind the exact immutable receipt policy and human result. Explicit per-report payloads are rehashed, with no numeric production default or latest-policy fallback. Null policy skips resolution, commits valid gap/hash state, preserves `pending_config` and cannot receive later policy/retroactive points. Nonnull archive failure grants no award and does not roll back valid evidence; current wire has only `ineligible` for that nonnull no-award result, so Root must retain every pinned payload through the session lifetime. Conflict resolution preserves existing awarded identity/time.

`createSourceBackedReviewRuntime` uses genuine SourceReview/preparation/normalized-media factories. Reject consumes metadata-only atomic CAS; queued failures use real Session `failQueued`. Image POST prepares before reserve, schedules only a fresh effect and strips leases. AI advice remains isolated from knowledge/rewards. Root must merge registries, use the Sources recovery wrapper, seed/reconcile gaps in the same source/clock transaction, and supply an optional exact archived-policy resolver. Default null receipts need no reward configuration.

Validation: **344 unit tests /1,701 assertions passed**, focused lint and diff check passed. Final genuine Workerd: **6/17 passed, 11 failed at Source409**, with the same source guard independently visible at source-review-apply.ts:22-26. Image lifecycle/failQueued/privacy and real normalized-media service with one explicitly fake OpenAI transport passed. Full API typecheck retains four external producer diagnostics; scoped test typechecks retain only Source's missing three Report fields. No Review-owned diagnostic. No M1/E2E pass is inferred.

The Workerd harness uses actual Root functional-v2 catalog/persistence, real Source registry/adapter, SQLite DO and local R2, with explicitly arranged pre-existing canonical M1 receipts and normalized procedural PNG derivatives. It does not bypass Source apply or prove submission/normalization. First runner transport became uncertain; after checking no runner remained, later runs completed. The final result above supersedes earlier fixture-baseline failures. Optional live-model/device/full-app/visual checks were deferred; no credential, network/provider or resource setup was attempted.

Fingerprint evidence: 1,017 raw indexed artifacts matched at source `d6e5fdf541ddbb018d4778237196e54fc4a01ee7`, index/base and exact launch. Policy hash `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`; contract index hash `90e923e9a92af548aefa38975eb3d177805521862ff68b7b16a423903eff82cd`. Functional-v2 manifest raw SHA256 `64719ca3cb494d393598aa81e297d1951cd916920328996e56de149907e0be3b`; procedural PNG `1ae5d1b406a5aea5bd6c91a126710100063ad0a96883866c6ced960c3fd027a6` (187 bytes). Explicit test-only policy `rewardpolicy_fixture01/test-v1`, seven points per report, payload hash `d9b26736371292f03bdf36aa4978199f939f7367a61518e3673d51c0447e65e8`. No production reward amount is introduced. Source changed26owned paths; all23codefiles are under200lines, maximum125.

## SourceEvidence

```json
{
  "work_item_id": "review-rewards-m1-reward-v5",
  "role_id": "review-rewards",
  "base_sha": "2a440311b4a8a78f1dc3303e7aa9c8c35d097f40",
  "observed_launch_sha": "c30dd59defde31e222e4a52416ad3e6f553d0bb0",
  "status": "blocked",
  "contract_sha256": "90e923e9a92af548aefa38975eb3d177805521862ff68b7b16a423903eff82cd",
  "changed_paths": [
    "apps/api/src/features/knowledge/conflict-review/resolve-transition.ts",
    "apps/api/src/features/reports/review/README.md",
    "apps/api/src/features/reports/review/image/router.ts",
    "apps/api/src/features/reports/review/image/service.ts",
    "apps/api/src/features/reports/review/index.ts",
    "apps/api/src/features/reports/review/review-result.ts",
    "apps/api/src/features/reports/review/review-transition.ts",
    "apps/api/src/features/reports/review/runtime-types.ts",
    "apps/api/src/features/reports/review/source-runtime.ts",
    "apps/api/src/features/rewards/reward-policy.ts",
    "apps/api/src/features/rewards/views.ts",
    "apps/api/test/coverage/scoped-coverage.test.ts",
    "apps/api/test/review/m1-rewards.test.ts",
    "apps/api/test/review/runtime/README.md",
    "apps/api/test/review/runtime/image.workerd.ts",
    "apps/api/test/review/runtime/m1-policy.workerd.ts",
    "apps/api/test/review/runtime/review.workerd.ts",
    "apps/api/test/review/runtime/runtime-fixtures.ts",
    "apps/api/test/review/runtime/runtime-worker.ts",
    "apps/api/test/review/runtime/source-fixture.ts",
    "apps/api/test/rewards/fixtures.ts",
    "apps/api/test/rewards/reward-proposal.test.ts",
    "packages/domain/src/rewards/README.md",
    "packages/domain/src/rewards/propose-reward.ts",
    "packages/domain/src/rewards/report-evidence.ts",
    "packages/domain/src/rewards/types.ts"
  ],
  "checks": [
    {
      "command": "python3 /tmp/review-v5-artifacts.py",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "git merge --ff-only --no-stat c30dd59defde31e222e4a52416ad3e6f553d0bb0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun test apps/api/test/review apps/api/test/rewards apps/api/test/coverage",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun run --cwd apps/api typecheck",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "fail",
      "evidence_path": null
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/rewards/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "fail",
      "evidence_path": null
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/review/runtime/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "fail",
      "evidence_path": null
    },
    {
      "command": "bun --bun run eslint --no-ignore packages/domain/src/rewards apps/api/src/features/reports/review apps/api/src/features/knowledge/conflict-review apps/api/src/features/rewards apps/api/test/review apps/api/test/rewards apps/api/test/coverage --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "node node_modules/vitest/vitest.mjs run --config apps/api/test/review/runtime/vitest.config.ts --reporter=verbose",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "fail",
      "evidence_path": null
    },
    {
      "command": "git diff --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "git verify-commit 0fbf27784762b74aad3225d9fb2c708bc28cbc31",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    }
  ],
  "smoke": [
    {
      "scenario": "Genuine Source-backed Review with real Source registry/catalog/persistence, SQLite SessionDO and local R2; arranged canonical M1 receipts/normalized procedural PNG, fake provider transport",
      "observed_result": "Final actual Workerd run: 17 tests, 6 passed and 11 failed in24.04s. The 11 failures reach genuine manual Accept/Reject and receive409; competing reviews receive409/409. Source apply still freezes required M1 human/reward fields. Six passed: metadata reserve/start/complete/reuse, actual clock-expiry rejection, deadline/eviction, dispatcher-only image privacy, queued failure without fake start, actual Source normalized-media port + durable service + exactly one fake Responses transport. No submit/normalization/live-model proof.",
      "result": "fail",
      "evidence_path": null
    }
  ],
  "public_exports": [
    "createSourceBackedReviewRuntime(ports, SourceBackedReviewOptions) returns source, combined Review/preparation registry and router using genuine Source public factories.",
    "prepareRewardPolicy(RewardPolicyPayload) validates/hashes immutable explicit per_report configuration; ReviewOptions.resolveRewardPolicy receives exact receipt ID/version/hash and returned payload is rehashed.",
    "Reject consumes actual ReducerDefinition.requireCas; advisory service defaults to actual imageReview.failQueued, and image POST performs genuine Source preparation before reserve."
  ],
  "integration_requests": [
    "SourcesMedia: packages/domain/src/reporting/submit-report.ts must produce required reward, review_result_id and reviewed_at fields at receipt, pinning an explicit server policy or preserving null/pending_config. Current literal omits all three required M1 fields; actual submit-to-review E2E remains blocked.",
    "SourcesMedia: apps/api/src/features/reports/source-review-apply.ts:22-26 still treats reward, review_result_id and reviewed_at as immutable receipt facts because its mutable projection excludes only legacy fields. Permit authorized canonical review/reward transitions while keeping reward.policy immutable; do not bypass or replace the genuine apply guard.",
    "Root/IntegrationLead: retain every archived policy payload by exact policy_id/version/config_hash through session lifetime and inject resolveRewardPolicy. Do not replace receipt pins with current policy; null receipts remain pending_config and never auto-pin or receive retroactive points.",
    "Root/IntegrationLead: compose createSourceBackedReviewRuntime with genuine shared scenarioCatalog/simulationPersistence, merged registry/router and sources.createSessionObject(combinedRegistry); seed/reconcile review gaps atomically. No source/core/central edit is included here."
  ],
  "blocked_prerequisites": [
    "Pending SourcesMedia action, not denied: submit-report.ts:14 must serialize reward/review_result_id/reviewed_at with immutable receipt pin or null; actual submission is not replaced by arranged fixtures.",
    "Pending SourcesMedia action, not denied: source-review-apply.ts:22-26 treats new reward/review identity as immutable facts. Permit canonical human/reward transitions while independently calling assertReceiptRewardPolicyUnchanged; genuine Workerd Accept/Reject returns409 until that producer is integrated.",
    "Baseline compiler failures remain in Source submit-report.ts:14, Results aggregate-evaluation.ts:31, Planner job-leases.ts:28/job-transitions.ts:44. Scoped test typechecks contain only Source required-field failure; no Review-owned compiler diagnostic.",
    "Null-policy knowledge and exact-policy logic pass unit tests, but genuine successful manual Accept/Reject/award/CAS/Reset/conflict proof requires the Source amendment. No review-ready/backend-ready/M1/fullE2E/device/liveOpenAI/calibration/release gate is claimed."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "0fbf27784762b74aad3225d9fb2c708bc28cbc31",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```
