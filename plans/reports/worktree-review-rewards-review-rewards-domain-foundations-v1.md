# ReviewRewards — independent domain foundations

Status: code-ready-for-integration for this partial work item only. Phase07 and review-ready remain pending.

## Identity and startup evidence

- Worktree: `/Users/vominhlong/seahackathon-worktrees/07-review-rewards`; branch `feat/floodops-review-rewards`.
- Source commit C: `8946cdbfe0f783e3536300677276e1605d46d3f5` (signed ED25519; `git verify-commit` passed). Enclosing report commit is supplied out of band.
- Exact launch: `e2e8feef2ddd94fcb7dbe2bb609ddda8c60487fc`; base `8074d280b8c315b96df7ba018311690e050a718b`.
- Receipt: `worktree-execution/launch/review-rewards/review-rewards-domain-foundations-v1.json`; authorized amendment `independent-downstream-domain-v1`.
- Policy pinned to `aea042b5fdb5100e826672111f326d3a03847ee7`, SHA256 `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`.
- Contract index pinned to `3ec303eae32f899edef0909527ca72195fdbff9f`, SHA256 `69cb1d52e620d0bad6e4732c7d73f5e72b58281bf443265cd6fa79cc1e7aa40e`, indexed source `d14dc05ff0a944639b699eae5b1de4b42c690e67`.
- Startup verified clean exact branch/HEAD, metadata-only base-to-launch delta, all required gate ancestors, policy/index hashes and all371 artifact hashes at indexed source/index/launch. Raw PNG bytes used Uint8Array from git show, not UTF8 decoding.
- Allowed writes were only reward domain, isolated review/rubric, review/rewards/coverage tests and this exact report. Central configs/exports/lock/manifests/receipts/gates were untouched. No server started; reserved port8787 unused. Bun1.4.0 frozen own-worktree install used --ignore-scripts; no copied node_modules/env.
- Requested sol/ultra/fast launch metadata was not exposed for worker self-verification; actual model/effort/tier remain unverified here.

## Completed behavior and review

- Strict canonical ImageReviewModelOutput validation; server-derived half-up score and exact recommendation precedence. All81 rating vectors ×3 match states covered. Unknown authority/derived fields, malformed/nonfinite/fractional ratings, required/bounded Unicode strings and arrays are rejected. No result stays null; valid zero remains distinct. Model text is bounded inert data; no AI input reaches reward proposals.
- Pure useful coverage requires accepted, current, correct source/segment/vehicle/epoch, nonunknown and no unresolved conflict. Low confidence counts coverage while route authority is unchanged.
- Gap proposals allocate explicit unused occurrence IDs and preserve immutable prior history. Non-report camera/system coverage fills gaps with null report/award pointers and never earns points.
- Accepted report proposal binds current evidence by canonical observation IDs, report evidence linkage and capture minute. It records server-normalized photo hashes, blocks duplicates across reports/contributors, uses positive explicit points/configured community source eligibility and creates at most one award/report and first-fill award/gap. Awards require their contributor-bound photo claim and a gap opened before the award sequence.
- Any unresolved current vehicle conflict blocks all fills/awards for the report, including a vehicle outside the reward-relevant subset. Photo identity remains registered for later resolution; superseded historical conflict does not block resolved evidence. No source normalization or conflict supersession is implemented here.
- Expiry opens a fresh gap occurrence without clawing back valid points or awarding the old report again. Reset seeds a separate empty generation; mismatched contexts fail. Proposals carry explicit server session/generation/time/epoch/IDs/event sequence; no hidden clock/random/network.
- Independent code review found and fixed missing camera fills, award/photo linkage, award/gap chronology and report-wide conflict boundaries. Final bounded review:9.5/10,0unresolved findings. Tester/debugger executed focused checks; project/docs audit kept full phase steps pending.

## Actual checks and smoke

Latest final source: **298 tests passed,0failed,1,449assertions**. Scoped strict TypeScript and ESLint with --no-ignore passed; every source module is below200lines. The explicit lint flag evaluates owned coverage tests despite the inherited generic ignore. Fifteen owned source/test files were staged explicitly, including force-add for the ignored coverage source. No assertions or safety tests were weakened.

Production-function smoke passed: quality_score75,looks_consistent; configured award7; coverage1/2; car gap open; replay new_award=null. It exercises actual new pure functions, without a provider, HTTP router or durable commit.

- Seed SHA256: `9221838f4f08cb0056244a9f5675319748f92378b097d24e746bdaaf4f665902`.
- Serialized functional-fixture config SHA256: `da7bf088cff2f4a0e936f9ca65eda7a4319582ba03ec79c962c19d91191e83cd`.
- These hashes identify test inputs, not a sealed/calibrated D04 dataset or a vision-quality evaluation. The fixture media bytes were not read by this feature.
- Check stdout is in the execution transcript; no raw image, personal data, credentials or private report content were saved as artifacts. The reproducible smoke entrypoint is `apps/api/test/rewards/smoke.ts`.

## Plan sync-back and limitations

Lead may record partial progress only:07.01rubric core;07.03pure coverage;07.04/05/07gap/award/expiry/Reset proposals. Keep07.02conflict normalization,07.06ledger APIs, durable acceptance and all full phase/gate checkboxes pending. In-memory replay is not durable concurrency or crash proof. Manual human decision, knowledge commit, award commit and route approval remain outside this advisory slice.

The integration requests and deferred prerequisites below are required for continuation. No outstanding local blocker remains for this narrow delivery. No push, merge, deploy, account/resource/key creation, live provider, preview or device action occurred.

## SourceEvidence

```json
{
  "work_item_id": "review-rewards-domain-foundations-v1",
  "role_id": "review-rewards",
  "base_sha": "8074d280b8c315b96df7ba018311690e050a718b",
  "observed_launch_sha": "e2e8feef2ddd94fcb7dbe2bb609ddda8c60487fc",
  "status": "code-ready-for-integration",
  "contract_sha256": "69cb1d52e620d0bad6e4732c7d73f5e72b58281bf443265cd6fa79cc1e7aa40e",
  "changed_paths": [
    "apps/api/src/features/reports/review/rubric/index.ts",
    "apps/api/test/coverage/useful-coverage.test.ts",
    "apps/api/test/review/rubric.test.ts",
    "apps/api/test/rewards/fixtures.ts",
    "apps/api/test/rewards/lifecycle.test.ts",
    "apps/api/test/rewards/reward-proposal.test.ts",
    "apps/api/test/rewards/smoke.ts",
    "apps/api/test/rewards/tsconfig.json",
    "packages/domain/src/rewards/coverage.ts",
    "packages/domain/src/rewards/gaps.ts",
    "packages/domain/src/rewards/index.ts",
    "packages/domain/src/rewards/propose-reward.ts",
    "packages/domain/src/rewards/report-evidence.ts",
    "packages/domain/src/rewards/types.ts",
    "packages/domain/src/rewards/validation.ts"
  ],
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun run - (byte-safe startup preflight importing sha256 from tooling/orchestration/delivery-verifier-core.ts)",
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
      "command": "bun --bun run tsc --noEmit -p apps/api/test/rewards/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun --bun run eslint --no-ignore packages/domain/src/rewards apps/api/src/features/reports/review/rubric apps/api/test/review apps/api/test/rewards apps/api/test/coverage --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun run apps/api/test/rewards/smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "git verify-commit 8946cdbfe0f783e3536300677276e1605d46d3f5",
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
      "scenario": "Frozen functional_fixture pure rubric + accepted low-confidence motorbike report + replay",
      "observed_result": "score75/looks_consistent; configured award7; coverage1of2; motorbike gap filled; car gap open; replay new_award=null; report remains accepted input without domain mutation; no route authority",
      "result": "pass",
      "evidence_path": null
    }
  ],
  "public_exports": [
    "packages/domain/src/rewards/index.ts: deriveUsefulCoverage, proposeGapOpenings, proposeSourceGapFills, proposeReportReward, createRewardLedger, validateLedger, RewardProposalError and explicit server input/proposal types",
    "apps/api/src/features/reports/review/rubric/index.ts: deriveImageReviewAdvice, deriveImageReviewResult"
  ],
  "integration_requests": [
    "IntegrationLead: add packages/domain/package.json export ./rewards -> ./src/rewards/index.ts; tests currently reference only the own exact index relatively.",
    "IntegrationLead: map @floodops/test-fixtures workspace dependency for API tests. Current tests consume its exact published frozen public src/index.ts entrypoint relatively; no producer private implementation import or copied fixture.",
    "IntegrationLead: exempt apps/api/test/coverage source tests from generic .gitignore/ESLint coverage-directory ignores. This delivery explicitly force-staged that owned source file and ran --no-ignore scoped lint; no config was changed.",
    "Issue fresh full-role receipt after actual platform-ready and sources-ready. Compose these candidates atomically with SourcesMedia acceptance/conflict proposals inside SessionPlatform DO; do not commit gap/award after a separate source acceptance.",
    "Provide explicit positive award-points and eligible community-source IDs at composition; functional fixture contains no committed award-points parameter, so no production default is selected here."
  ],
  "blocked_prerequisites": [
    "Full phase07 service/job/router/provider, normalized media ownership/readiness/digest integration, durable lease/quota/current-pointer state and dispatcher projection require a fresh full receipt and real predecessor gates.",
    "Durable exactly-once transaction/race/crash/idempotency, actor authorization, scoped ledger HTTP projections and cross-client integration remain unverified by these pure in-memory proposals.",
    "No live provider/model/image-quality, preview, device, calibration, production or release acceptance was performed. Existing D04/model/device/dependency audit prerequisites are not waived."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "8946cdbfe0f783e3536300677276e1605d46d3f5",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```
