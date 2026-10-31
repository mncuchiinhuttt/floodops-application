# SourcesMedia M1 canonical review adapter — SourceEvidence

**Canonical adapter and real media ports are implemented and ready for integration.** Source C `d1c880ab14f322afffc22b2e28c8712d8e8672c4` is signed and verified. Standard typechecks remain pending a single pre-existing excluded Review error; no own adapter diagnostic was found. No full gate was published.

## Startup and scope

- Exact launch `b686741d5b5273526f5eb5657a290c4df6fde746`, base `afb8f9c167ce48d8886644af5a8b29899ee1446b`; contract index SHA `e7065b1e2a71db2d58a0dc4f5acf06c77026da1dee990c2678785589909b6777`; policy SHA `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`. Verified721 raw-byte artifacts and6 required gate ancestries before writes. Previous signed R was preserved; exact launch fast-forwarded with no reset/stash/rebase.
- CWD/branch: `/Users/vominhlong/seahackathon-worktrees/05-sources-media`, `feat/floodops-sources-media`. Bun1.4.0 frozen install --ignore-scripts passed with no dependency changes.
-17 owned source/test/doc paths; all regular files, TypeScript files below200lines. No domain, central manifest/lock/API entrypoint/config, excluded Review/conflict-review, contract/gate/policy or other report changes. Three helpers reviewed/proposed patches under /tmp; only this root applied repo edits.

## Delivered behavior

- `createSourceReviewPort(ports)` reads genuine stored receipts and Simulation checkpoints, current evidence/knowledge, authoritative pairs, frozen relevant scope and stable conflict occurrences. The original participant, receipt time, bound vehicles, source and capture epochs survive human review. Current dispatcher identity authorizes the action separately.
- Pure synchronous `apply` preserves immutable report facts, upload/writer/recovery/source metadata and unrelated namespaces. It validates unchanged pair epochs and reconciled evidence, uses public `applyKnowledgeTransition`, skips unnecessary simulator effects for metadata-only review, and returns full proposed values. Review alone combines its ledger/audit atomically inside the real DO.
- Source-owned `sourceReview` metadata holds conflict history and prepared image bindings; Reset clears it through the genuine seed. Image readiness works for accepted reports used by later conflict resolution. Later duplicates cannot poison the first original receipt.
- Real image preparation authorizes a full canonical report, verifies private normalized bytes/hash, invokes the injected PUBLIC Review SHA preparation outside transactions, then attaches via dispatcher-authenticated metadata reducer with current report/generation/config/context and independent synchronous SHA verification. No copied Review context algorithm, fabricated digest, network await in reducers, public generic endpoint, URL/raw-byte fallback or provider call.
- `createSourceImageReviewMediaPort` reads actual private bytes and checks persisted job digest/session/generation/model/config/current report after awaits. It rejects caller substitutions, duplicate or unauthorized media, changed config, abort and Reset. Recovery wrapper remains intact.
- Frozen functional-v2 now supplies the configured driver Source; genuine v2 quick reports and citizen contradiction/resolution pass. The previous v1 missing-driver blocker is resolved for v2. Historical v1 is immutable and calibration is incomplete.

## Actual validation

- **71 Bun tests,259 assertions,0fail** (includes19 new real-source pure guard cases; their Cloudflare loader shim makes no DO/RPC claim).
- **14 new actual Workerd integration tests across3files,0fail**, using genuine Sources routers/reducers, public Review runtime, real local SQLite DO/private R2/Images and frozen functional-v2. Actual HTTP requests prove original contributor attribution, capture TTL/epochs, vehicle scope, persistence after eviction, exact replay before stale CAS, competing reviewers, duplicate precedence, genuine driver conflict/resolution, atomic rollback after a late event failure, authenticated private bytes, canonical prepared binding, forged SHA/config/generation/abort/manual-review/Reset fences.
- **25 existing actual Workerd media/recovery tests across5files,0fail**. These preserve auth/webCSRF/native capabilities, decoder/EXIF/limits/deduplication and late-write lifecycle evidence.
- Scoped ESLint --max-warnings=0, whitespace and ownership/regular-file/line-count checks pass. C signature verifies with existing signing configuration.
- Both standard API/media and source test typechecks were executed. Each fails **only** baseline `apps/api/src/features/reports/review/state.ts(39,47): TS2367` for stale `SOURCE_SCOPE_INCOMPATIBLE`; that file is excluded Review ownership, so it was not edited or suppressed. This is a pending external correction, not a denied action or own code failure.
- Synthetic local image/test reward policy is explicit. No real provider/model/production Images entitlement/device/calibration/frontend E2E/release proof is claimed. Test-only controlled clock/fault reducer is confined to the isolated harness. No remote push/main merge/deploy/paid/account/key action.

## Integration and remaining owner work

1. Lead: inject createSourceReviewPort(ports) into createReviewRuntime. Merge Sources+Review+optional Source image-preparation registries and retain sources.createSessionObject(combinedRegistry) for durable media recovery. Adapter implementation is ready for immediate integration.

2. Optional image composition: options={config:imageConfig,prepare:public prepareImageReviewBinding,contextKey:public imageContextKey}. Register createSourceImagePreparationRegistry(ports,options); await prepareSourceReviewImage(env,options,authenticatedContext,reportId) outside transactions; pass createSourceImageReviewMediaPort(env,options) to the Review service. No live call is made by these ports.

3. ReviewRewards: remove stale SOURCE_SCOPE_INCOMPATIBLE comparison at reports/review/state.ts:39 through its own receipt; both standard typechecks currently fail TS2367 only there, with no own adapter diagnostic.

4. Review/source-clock composition: reconcile gap occurrences when deterministic quick-driver acceptance changes coverage. Existing quick path bypasses the Review ledger and reconcileReviewGaps only opens gaps. The current pipeline test proves conflict/resolution award once under explicit old test policy, not a v0.5 gap/policy gate. Keep ledger logic Review-owned.

5. Contracts/Review v0.5 continuation: pin policy/version at free-report receipt; absent configuration must leave eligibility pending_config while manual knowledge acceptance still works; later configuration cannot retroactively award. Do not invent zero points, missions or unknown strict fields before the new contract receipt.

6. Review/Platform owners: metadata Reject CAS and queued-image-failure hooks remain separate current tasks; no complete review/backend/frontend gate is asserted by this delivery.

## Machine-readable SourceEvidence

```json
{
  "work_item_id": "sources-media-review-adapter-v3",
  "role_id": "sources-media",
  "base_sha": "afb8f9c167ce48d8886644af5a8b29899ee1446b",
  "observed_launch_sha": "b686741d5b5273526f5eb5657a290c4df6fde746",
  "status": "code-ready-for-integration",
  "contract_sha256": "e7065b1e2a71db2d58a0dc4f5acf06c77026da1dee990c2678785589909b6777",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a",
  "source_sha": "d1c880ab14f322afffc22b2e28c8712d8e8672c4",
  "changed_paths": [
    "apps/api/src/features/reports/README.md",
    "apps/api/src/features/reports/index.ts",
    "apps/api/src/features/reports/source-image-port.ts",
    "apps/api/src/features/reports/source-image-preparation.ts",
    "apps/api/src/features/reports/source-review-apply.ts",
    "apps/api/src/features/reports/source-review-context.ts",
    "apps/api/src/features/reports/source-review-state.ts",
    "apps/api/src/features/reports/source-review.ts",
    "apps/api/src/features/sources/README.md",
    "apps/api/test/media/review-adapter-fixtures.ts",
    "apps/api/test/media/review-adapter-worker.ts",
    "apps/api/test/media/source-review-adapter.workerd.ts",
    "apps/api/test/media/source-review-conflicts.workerd.ts",
    "apps/api/test/media/source-review-image.workerd.ts",
    "apps/api/test/media/vitest.review-adapter.config.ts",
    "apps/api/test/media/wrangler.review-adapter.jsonc",
    "apps/api/test/sources/source-review-guards.test.ts",
    "plans/reports/worktree-sources-media-sources-media-review-adapter-v3.md"
  ],
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-review-adapter-v3.md"
    },
    {
      "command": "bun test apps/api/test/sources apps/api/test/observations",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-review-adapter-v3.md"
    },
    {
      "command": "bun --bun node_modules/vitest/vitest.mjs run --config apps/api/test/media/vitest.config.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-review-adapter-v3.md"
    },
    {
      "command": "bun --bun node_modules/vitest/vitest.mjs run --config apps/api/test/media/vitest.review-adapter.config.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-review-adapter-v3.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/media/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "fail",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-review-adapter-v3.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/sources/test-tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "fail",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-review-adapter-v3.md"
    },
    {
      "command": "bun --bun node_modules/eslint/bin/eslint.js apps/api/src/features/reports/index.ts apps/api/src/features/reports/source-review*.ts apps/api/src/features/reports/source-image*.ts apps/api/test/media/review-adapter*.ts apps/api/test/media/source-review-*.workerd.ts apps/api/test/media/vitest.review-adapter.config.ts apps/api/test/sources/source-review-guards.test.ts --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-review-adapter-v3.md"
    },
    {
      "command": "git diff --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-review-adapter-v3.md"
    },
    {
      "command": "git verify-commit d1c880ab14f322afffc22b2e28c8712d8e8672c4",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-review-adapter-v3.md"
    }
  ],
  "smoke": [
    {
      "scenario": "Actual local Workerd HTTP Sources upload -> normalization -> pending report -> public human Review -> canonical Simulation persistence",
      "observed_result": "Functional-v2 driver-ready; original actor/receipt/captured epochs preserved, low bike evidence expiry3, car unknown, one atomic source/ledger/audit commit;14 integration tests pass.",
      "result": "pass",
      "evidence_path": "apps/api/test/media/source-review-adapter.workerd.ts"
    },
    {
      "scenario": "Actual quick driver -> citizen conflict -> explicit resolution plus genuine prepared-image metadata/Reset fences",
      "observed_result": "Conflict persists until human resolution; accepted photo metadata supports one award. Real bytes/hash/prepared SHA, replay-before-CAS, concurrent CAS, stale epoch/TTL, rollback, role/duplicate/generation/config/abort/manual-review/Reset/forged-SHA fences pass.",
      "result": "pass",
      "evidence_path": "apps/api/test/media/source-review-image.workerd.ts"
    }
  ],
  "public_exports": [
    "apps/api/src/features/reports/index.ts:createSourceReviewPort(ports):SourceReviewPort",
    "apps/api/src/features/reports/index.ts:createSourceImagePreparationRegistry(ports,options):RuntimeRegistry",
    "apps/api/src/features/reports/index.ts:prepareSourceReviewImage(env,options,context,reportId)",
    "apps/api/src/features/reports/index.ts:createSourceImageReviewMediaPort(env,options):ImageReviewMediaPort",
    "apps/api/src/features/reports/index.ts:SourceImagePreparationOptions"
  ],
  "integration_requests": [
    "Lead: inject createSourceReviewPort(ports) into createReviewRuntime. Merge Sources+Review+optional Source image-preparation registries and retain sources.createSessionObject(combinedRegistry) for durable media recovery. Adapter implementation is ready for immediate integration.",
    "Optional image composition: options={config:imageConfig,prepare:public prepareImageReviewBinding,contextKey:public imageContextKey}. Register createSourceImagePreparationRegistry(ports,options); await prepareSourceReviewImage(env,options,authenticatedContext,reportId) outside transactions; pass createSourceImageReviewMediaPort(env,options) to the Review service. No live call is made by these ports.",
    "ReviewRewards: remove stale SOURCE_SCOPE_INCOMPATIBLE comparison at reports/review/state.ts:39 through its own receipt; both standard typechecks currently fail TS2367 only there, with no own adapter diagnostic.",
    "Review/source-clock composition: reconcile gap occurrences when deterministic quick-driver acceptance changes coverage. Existing quick path bypasses the Review ledger and reconcileReviewGaps only opens gaps. The current pipeline test proves conflict/resolution award once under explicit old test policy, not a v0.5 gap/policy gate. Keep ledger logic Review-owned.",
    "Contracts/Review v0.5 continuation: pin policy/version at free-report receipt; absent configuration must leave eligibility pending_config while manual knowledge acceptance still works; later configuration cannot retroactively award. Do not invent zero points, missions or unknown strict fields before the new contract receipt.",
    "Review/Platform owners: metadata Reject CAS and queued-image-failure hooks remain separate current tasks; no complete review/backend/frontend gate is asserted by this delivery."
  ],
  "blocked_prerequisites": [
    "PENDING shared Review baseline TS2367 at apps/api/src/features/reports/review/state.ts:39; standard API/source typechecks executed and failed only there. Not denied; unchanged excluded owner code.",
    "PENDING Lead composition/Review platform hooks and new v0.5 Contracts policy refreeze; no full gate or frontend/device/model acceptance claim."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false
}
```
