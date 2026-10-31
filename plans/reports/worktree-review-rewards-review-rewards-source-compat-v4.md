# ReviewRewards source compatibility v4

Status: code-ready-for-integration for this narrow correction only.

- Worktree `/Users/vominhlong/seahackathon-worktrees/07-review-rewards`, branch `feat/floodops-review-rewards`.
- Signed source C: `514c9680ce8a995d685ea96b796abc6f61808d1f`, direct child of exact launch `b686741d5b5273526f5eb5657a290c4df6fde746`; Good git ED25519 signature verified. Report commit is supplied out of band.
- Previous clean R `9f7a503b516bf31a8b1091a1ac9239bafbebd97c` preserved by authorized fast-forward. Base `afb8f9c167ce48d8886644af5a8b29899ee1446b`.
- Receipt `worktree-execution/launch/review-rewards/review-rewards-source-compat-v4.json`, amendment `m1-deterministic-cutover-v1`.
- Pinned policy commit `aea042b5fdb5100e826672111f326d3a03847ee7`, hash `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`.
- Input index at base, hash `e7065b1e2a71db2d58a0dc4f5acf06c77026da1dee990c2678785589909b6777`, indexed source `34fa8539c2ef61b6df6c0798d9792e7d8cd74f7a`.
- Startup verified clean branch/HEAD, gate ancestry, metadata-only base/launch delta, policy/index hashes and all721raw-byte artifacts at source/index/launch. Frozen Bun1.4.0 install --ignore-scripts checked1261packages with no changes. Actual requested model/effort/tier self-verification unavailable.

## Correction and evidence

Standard API typecheck reproduced TS2367 at reports/review/state.ts:39 before the fix. The integrated public SourceFailure union no longer includes SOURCE_SCOPE_INCOMPATIBLE, but Review still compared it. Source C removes only that obsolete comparison. No casts, restored/forked producer enum, weakened guard or changed public wire behavior was introduced.

The new targeted regression uses actual public SourceDomainError/SourceFailure types for CONFIG_INCOMPLETE, FORBIDDEN, DUPLICATE_IMAGE, INVALID_IMAGE, INVALID_SCHEMA, STALE_EPOCH, EXPIRED and INVALID_TRANSITION. It verifies status plus canonical ErrorResponse code/message and null data, and preserves unrelated exception identity.

Final actual checks:

- Standard API typecheck:pass.
- Review unit suite:293passed,0failed,1,410assertions across3files; all9new cases pass.
- Focused unit-test typecheck and scoped ESLint:pass.
- Actual existing Workerd smoke/runtime suite:16passed across2files, using genuine Hono/SQLite DO/public pure Source and simulator ports with declared synthetic source/media and fake provider transport.
- Core compatibility review:9.8/10,0unresolved findings; docs/ownership audit passes for exactly2source paths.

This is a source compatibility correction, not a new image/model/device evaluation. Test stdout is in execution history; no private data, credentials or raw image were saved. Existing safe smoke assertions and reproducible actual Workerd command remain in the harness. No new physical/config values, fixtures, source state or exports were created.

## M1 boundary and continuation

Read the pinned PRDv0.5 and explicit M1 amendment. M1 is31US web core with deterministic planning and free reports, without a mission prerequisite. Native/campaign/student/forecast and runtime AI Commander work are outside this correction. Legacy66API/194schema/8tool artifacts are still valid input wire, not an asserted M1 refreeze.

No v0.5 reward receipt-policy/pending_config semantics, model/depth delta, new platform hook or Source adapter was implemented ahead of Contracts/producer cutover. Existing runtime code remains intact. Full review/backend/M1 acceptance stays pending actual integration/E2E; this small correction has no local blocker.

Static follow-up only: reviewer found retired-error expectations in SimulationData's scoped-conflict pipeline/smoke tests. Those checks were not executed or edited here; their runtime status is unverified. Exact owner paths are in integration_requests below.

No central config/manifest/lock/APIindex, source core, policy/schema/gate/spec or historical evidence edits; no remote push/main merge/deploy, paid provider, account/key/resource, device/EAS or credential change. Ports unused outside local test harness. Only the two listed source paths and this exact own report are delivered.

## SourceEvidence

```json
{
  "work_item_id": "review-rewards-source-compat-v4",
  "role_id": "review-rewards",
  "base_sha": "afb8f9c167ce48d8886644af5a8b29899ee1446b",
  "observed_launch_sha": "b686741d5b5273526f5eb5657a290c4df6fde746",
  "status": "code-ready-for-integration",
  "contract_sha256": "e7065b1e2a71db2d58a0dc4f5acf06c77026da1dee990c2678785589909b6777",
  "changed_paths": [
    "apps/api/src/features/reports/review/state.ts",
    "apps/api/test/review/source-errors.test.ts"
  ],
  "checks": [
    {
      "command": "git merge --ff-only --no-stat b686741d5b5273526f5eb5657a290c4df6fde746",
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
      "command": "bun run --cwd apps/api typecheck",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun test apps/api/test/review",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/rewards/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun --bun run eslint --no-ignore apps/api/src/features/reports/review/state.ts apps/api/test/review/source-errors.test.ts --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "node node_modules/vitest/vitest.mjs run --config apps/api/test/review/runtime/vitest.config.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "git verify-commit 514c9680ce8a995d685ea96b796abc6f61808d1f",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "git diff --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    }
  ],
  "smoke": [
    {
      "scenario": "Existing actual Hono/SQLite SessionDO review/image runtime with declared synthetic Source/media and fake provider transport",
      "observed_result": "16actual Workerd cases passed, including atomic Accept/replay/CAS/duplicate/conflict/expiry/privacy/Reset and fenced advisory behavior. No captured stdout or live-model/device claim.",
      "result": "pass",
      "evidence_path": null
    }
  ],
  "public_exports": [
    "Unchanged. sourceFailure keeps the same never-returning boundary; only an impossible retired-enum comparison is removed."
  ],
  "integration_requests": [
    "No public export or constructor change for this correction. Merge exact delivery to unblock standard API typecheck against the integrated public SourceFailure union.",
    "Future continuation only: adopt actual SessionPlatform requireCas/failQueued hooks and genuine SourceReviewPort after exact producer delivery/refreeze; do not use moving HEAD or fake missing ports.",
    "Contracts/Source continuation must implement PRDv0.5 report-receipt policy pin/pending_config and manual knowledge independence after coherent M1 refreeze. This correction preserves legacy valid wire and makes no mission requirement.",
    "SimulationData static follow-up, NOT executed in this slice: packages/simulation/test/movement/scoped-conflict-pipeline.test.ts:71 and packages/simulation/test/scenario/scoped-conflict-smoke.ts:16 retain expectations for retired SOURCE_SCOPE_INCOMPATIBLE. Review/update against actual scoped producer behavior without weakening conflict/closure safety assertions."
  ],
  "blocked_prerequisites": [
    "No local blocker remains for source-compat-v4. M1 contract refreeze/new reward semantics, independent platform hooks, genuine Source adapter composition and full M1 E2E require later integrated receipts. This delivery does not claim review-ready/backend-ready/M1 acceptance."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "514c9680ce8a995d685ea96b796abc6f61808d1f",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```
