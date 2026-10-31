# SourcesMedia M1 receipt policy — SourceEvidence

Source C `9d96859751f288b71f0202a925f6219c300ea781` is signed and ready for immediate receipt-producer integration. Full scope remains **blocked** by the explicit driver-quick identity incompatibility and concurrent Review migration; no M1 gate is claimed.

- Exact launch `c30dd59defde31e222e4a52416ad3e6f553d0bb0`, base `2a440311b4a8a78f1dc3303e7aa9c8c35d097f40`; index `90e923e9a92af548aefa38975eb3d177805521862ff68b7b16a423903eff82cd`; policy `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`. Verified1,017 artifacts/3,051 raw blobs and6 gate ancestors before source writes. Clean prior R fast-forwarded safely; frozen Bun1.4.0 install passed, no dependency changes.
-21 owned source/test/doc paths, regular files, code below200lines; no excluded Review/conflict-review, central manifests/lock/config/API entrypoint/schema/gate/policy edits. No remote push/main/deploy/provider/secret/device/paid action.
- Report receipt now serializes reward/review_result_id/reviewed_at. Missing policy yields pending_config/null/POLICY_NOT_CONFIGURED/null award; configured citizen awaits review; configured driver is ineligible. No mission, zero/default points or automatic later policy pin. Receipt policy is validated/cloned and original actor, capture epochs, mapping and normalized digest remain intact.
- Adapter allows genuine review outcome fields while enforcing canonical immutable policy (including null), award pointer equality, immutable terminal review identity and no driver community award. ReportContext reconstructs stored policy without recalling a current provider. Incomplete M1 terminal DTO fails503 before source/checkpoint persistence.
-19 focused pure receipt tests pass (54 assertions);7 real Sources-only Workerd HTTP tests pass. A pure genuine observation proposal applies manual knowledge with pending_config, using an explicitly identified test human-result fixture; this is not claimed as successful HTTP Review. Existing broader suites expose rather than hide incompatibilities:88pass/1quickfail of89 Bun tests;24pass/1quickfail of25 media tests;7pass/7fail of14 Review tests. Six Review failures are actual manual Accept422, the seventh is the quick503 prerequisite.
- Scoped lint and whitespace pass. API typecheck only has the three excluded Planner/Results errors below; submission missing-field error is fixed. Earlier broad-edit auto-review rejection was resolved by reading the NEW v4 domain/reporting grant and running original ownership+amendment matchers; the narrower exact patch was approved/applied. No denied action remains pending. Helper test startup EPERM was rerun by this authorized root; actual test counts above come from executed root runs.

## Exact integration actions

1. Lead can integrate the receipt producer now. SourcesPorts.receiptRewardPolicy is optional and synchronous; context={sessionId,generation,scenarioId,scenarioVersion,receivedAt,kind}, return RewardPolicyRef|null. Exported ReceiptPolicyContext/ReceiptRewardPolicyProvider are in scenario/index. Omit provider for honest pending_config. If supplied, Root must retain actual explicit configuration resolvable by policy_id+version+config_hash in Review; no amount is supplied by canonical scenario or invented by Sources.

2. URGENT Lead/Contracts decision: automatic driver quick acceptance has no human review identity, while M1 Report requires nonnull review_result_id/reviewed_at for every accepted/rejected kind. Choose an explicit contract exception for rules-accepted driver quick with null identity, OR define a genuine authorized quick-decision receipt. Current Sources final schema guard fails503 CONFIG_INCOMPLETE before persistence instead of fabricating a review. Existing quick tests remain red. Publish exact contract/receipt if schema changes; do not use sibling WIP.

3. Review owner must finalize reward/review identity before strict output and evaluate immutable receipt policy. Existing real manual Accept returns422 on this exact baseline; six legacy Review cases fail plus one quick prerequisite. Preserve null policy after configuration appears and never block manual knowledge acceptance for missing policy. Source adapter now permits canonical outcome fields but separately enforces receipt policy and terminal identity.

4. Planner/Results owners: standard API typecheck has only three excluded-owner errors: evaluations/pure/aggregate-evaluation.ts:31 model_config_hash; planning/job-leases.ts:28 and job-transitions.ts:44 MODEL_TIMEOUT instead of PLANNER_TIMEOUT. No Sources diagnostic remains.

5. Lead composes optional serialization fence with runtime_contract m1-v1/0.5.0-m1. Legacy state is retained, never rewritten/backfilled; explicit new session/Reset loads new seed. Full M1/backend/web/native/model gates remain unclaimed.

## SourceEvidence

```json
{
  "work_item_id": "sources-media-m1-receipt-v4",
  "role_id": "sources-media",
  "base_sha": "2a440311b4a8a78f1dc3303e7aa9c8c35d097f40",
  "observed_launch_sha": "c30dd59defde31e222e4a52416ad3e6f553d0bb0",
  "status": "blocked",
  "contract_sha256": "90e923e9a92af548aefa38975eb3d177805521862ff68b7b16a423903eff82cd",
  "source_sha": "9d96859751f288b71f0202a925f6219c300ea781",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a",
  "changed_paths": [
    "apps/api/src/features/reports/README.md",
    "apps/api/src/features/reports/report-context.ts",
    "apps/api/src/features/reports/runtime.ts",
    "apps/api/src/features/reports/source-review-apply.ts",
    "apps/api/src/features/reports/source-review-context.ts",
    "apps/api/src/features/scenario/index.ts",
    "apps/api/src/features/scenario/ports.ts",
    "apps/api/src/features/sources/README.md",
    "apps/api/test/media/m1-receipt-fixtures.ts",
    "apps/api/test/media/m1-receipt-worker.ts",
    "apps/api/test/media/source-m1-receipt.workerd.ts",
    "apps/api/test/media/vitest.m1-receipt.config.ts",
    "apps/api/test/media/wrangler.m1-receipt.jsonc",
    "apps/api/test/observations/pipeline.test.ts",
    "apps/api/test/observations/report-proposals.test.ts",
    "apps/api/test/sources/receipt-policy.test.ts",
    "apps/api/test/sources/source-review-guards.test.ts",
    "packages/domain/src/reporting/index.ts",
    "packages/domain/src/reporting/receipt-reward.ts",
    "packages/domain/src/reporting/report-types.ts",
    "packages/domain/src/reporting/submit-report.ts",
    "plans/reports/worktree-sources-media-sources-media-m1-receipt-v4.md"
  ],
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-m1-receipt-v4.md"
    },
    {
      "command": "bun test apps/api/test/sources/receipt-policy.test.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-m1-receipt-v4.md"
    },
    {
      "command": "bun --bun node_modules/vitest/vitest.mjs run --config apps/api/test/media/vitest.m1-receipt.config.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-m1-receipt-v4.md"
    },
    {
      "command": "bun test apps/api/test/sources apps/api/test/observations",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "fail",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-m1-receipt-v4.md"
    },
    {
      "command": "bun --bun node_modules/vitest/vitest.mjs run --config apps/api/test/media/vitest.config.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "fail",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-m1-receipt-v4.md"
    },
    {
      "command": "bun --bun node_modules/vitest/vitest.mjs run --config apps/api/test/media/vitest.review-adapter.config.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "fail",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-m1-receipt-v4.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/media/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "fail",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-m1-receipt-v4.md"
    },
    {
      "command": "scoped ESLint --max-warnings=0 and git diff --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-m1-receipt-v4.md"
    },
    {
      "command": "git verify-commit 9d96859751f288b71f0202a925f6219c300ea781",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-m1-receipt-v4.md"
    }
  ],
  "smoke": [
    {
      "scenario": "Actual functional-v2 Sources-only Workerd free upload/report receipt, later config, immutable A/B, driver text, strict authority and Reset",
      "observed_result": "7/7 pass with real local SQLite/R2/Images and server-derived normalized bytes/hash. No Review runtime or numeric reward amount is faked.",
      "result": "pass",
      "evidence_path": "apps/api/test/media/source-m1-receipt.workerd.ts"
    },
    {
      "scenario": "Existing full source/review compatibility against new M1 serialization",
      "observed_result": "Bun88pass/1quickfail of89; existing media24pass/1quickfail of25; Review7pass/7fail of14 (6manual422,1quick503). Failures retained and not waived;19 focused receipt tests pass including pure manual-knowledge proposal with pending_config.",
      "result": "fail",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-m1-receipt-v4.md"
    }
  ],
  "public_exports": [
    "SourcesPorts.receiptRewardPolicy?: ReceiptRewardPolicyProvider",
    "scenario/index.ts:ReceiptPolicyContext/ReceiptRewardPolicyProvider",
    "ReportContext.receiptRewardPolicy?: RewardPolicyRef|null",
    "@floodops/domain/reporting:receiptReward",
    "Existing createSourceReviewPort/createSourceImagePreparationRegistry/prepareSourceReviewImage/createSourceImageReviewMediaPort preserved"
  ],
  "integration_requests": [
    "Lead can integrate the receipt producer now. SourcesPorts.receiptRewardPolicy is optional and synchronous; context={sessionId,generation,scenarioId,scenarioVersion,receivedAt,kind}, return RewardPolicyRef|null. Exported ReceiptPolicyContext/ReceiptRewardPolicyProvider are in scenario/index. Omit provider for honest pending_config. If supplied, Root must retain actual explicit configuration resolvable by policy_id+version+config_hash in Review; no amount is supplied by canonical scenario or invented by Sources.",
    "URGENT Lead/Contracts decision: automatic driver quick acceptance has no human review identity, while M1 Report requires nonnull review_result_id/reviewed_at for every accepted/rejected kind. Choose an explicit contract exception for rules-accepted driver quick with null identity, OR define a genuine authorized quick-decision receipt. Current Sources final schema guard fails503 CONFIG_INCOMPLETE before persistence instead of fabricating a review. Existing quick tests remain red. Publish exact contract/receipt if schema changes; do not use sibling WIP.",
    "Review owner must finalize reward/review identity before strict output and evaluate immutable receipt policy. Existing real manual Accept returns422 on this exact baseline; six legacy Review cases fail plus one quick prerequisite. Preserve null policy after configuration appears and never block manual knowledge acceptance for missing policy. Source adapter now permits canonical outcome fields but separately enforces receipt policy and terminal identity.",
    "Planner/Results owners: standard API typecheck has only three excluded-owner errors: evaluations/pure/aggregate-evaluation.ts:31 model_config_hash; planning/job-leases.ts:28 and job-transitions.ts:44 MODEL_TIMEOUT instead of PLANNER_TIMEOUT. No Sources diagnostic remains.",
    "Lead composes optional serialization fence with runtime_contract m1-v1/0.5.0-m1. Legacy state is retained, never rewritten/backfilled; explicit new session/Reset loads new seed. Full M1/backend/web/native/model gates remain unclaimed."
  ],
  "blocked_prerequisites": [
    "PENDING explicit quick-driver terminal review identity interpretation/contract fix; Sources fails closed503 before saving an invalid M1 accepted report.",
    "PENDING Review M1 result/reward migration; current genuine manual Accept422.",
    "PENDING three excluded Planner/Results type errors and Lead final composition/acceptance."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false
}
```
