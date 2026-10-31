# ReviewRewards — scoped coverage and active-gap correction

Status: code-ready-for-integration for correction-v2 only. Full Phase07/review-ready/backend-ready remain outside this receipt.

## Startup and source identity

- Worktree: `/Users/vominhlong/seahackathon-worktrees/07-review-rewards`; branch `feat/floodops-review-rewards`.
- Source C: `e990fbaa3e273fda3fb362cf0b9f4e059dd52b61`, direct child of the exact launch; Good git ED25519 signature verified. Report commit is supplied out of band.
- Preserved previous signed R `fae580753fe6fa9675b19dd191d89c6b6b93b3e4`; verified clean and fast-forwarded to exact launch `2364a58e271a738790fe2a70fd47f67ad0befb52`. Base `223a58654210e934dfb1eda1092be33a7fdc30fe`.
- Receipt: `worktree-execution/launch/review-rewards/review-rewards-domain-correction-v2.json`; amendment `backend-repairs-client-runtime-v1`.
- Pinned policy commit `aea042b5fdb5100e826672111f326d3a03847ee7`, SHA256 `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`.
- Contract index at `223a58654210e934dfb1eda1092be33a7fdc30fe`, SHA256 `bda263b1d21bfa26994d857da94f97b8974a3cfee08059e805e889f765202527`, indexed source `91158e2dd79ebcdd8761d884784553afd4fc46c4`.
- Verified required gate ancestors including platform-ready, metadata-only base-to-launch delta, policy/index hashes and all654 artifact hashes at source/index/launch using raw Uint8Array git blobs. Frozen Bun1.4.0 install --ignore-scripts added67 packages in this worktree; no copied credentials/env/node_modules/state.
- Authorized source writes were rewards domain and manifest-owned coverage/rewards/review tests plus this exact report. Central configs, manifests, lock, policy, schemas, receipts and gates are unchanged. Reserved port8787 unused; no server started. Actual parent-requested model/effort/service-tier is unavailable to worker self-verification.

## Root causes, correction and regressions

1. `Observation.has_conflict` aggregates all vehicle scopes. The old consumer vetoed a shared observation globally, so a bike-only contradiction incorrectly removed consistent car coverage. Merely removing that veto would allow omitted contrary evidence/false flags to grant coverage. The corrected consumer selects all accepted available observation-source facts matching segment/vehicle/epoch and observed<=now<expires, requires known nonunknown current knowledge and consistent conditions, and returns only linked supporting IDs. No private producer implementation is imported or copied.
2. Reward conflict eligibility now inspects reported tuples from explicit current scope plus current knowledge, deduplicated by exact tuple. It blocks unresolved or actual matching contrary facts across every reported vehicle, including nonreward-relevant scopes and explicit scopes with a missing knowledge row. It preserves the car-only positive control when the conflict belongs only to a bike scope.
3. `projectActiveGaps` validates the ledger/current scope and returns isolated frozen open rows matching current segment/vehicle/epoch, in ledger order. Old-epoch open rows retain original IDs/status/sequences and remain audit history; epoch changes never fabricate a filled status or a new wire state. Existing fill proposals remain exact-epoch matched.

The new regression initially produced1pass/6fail/20assertions with no fixture/import setup errors. Failures showed false car exclusion in both orders, false-flag forged coverage/award, expiry stuck at zero and a blocked valid car-only award. During review, a separate actual public-fixture probe confirmed a missing bike knowledge row could allow a mixed report to award7 and fill the car gap; that guard was fixed and regression-tested with a car-only control.

Public consumer tests use `@floodops/domain/knowledge`, `@floodops/domain/sources`, `@floodops/simulation` and `@floodops/test-fixtures`: derive genuine normalized knowledge, seal/load/create a scenario, advance its clock, apply knowledge transitions, resolve a conflict through the public pure proposal and enforce an actual authoritative closure. Tests cover reversed evidence order, expiry boundaries, omitted contrary references/false flags/missing rows, report-wide no-fill/no-award, immutable history and old-epoch ineligibility. The former raw-flag-only zero-coverage assertion was replaced with the approved per-scope semantic assertion; real conflict/closure assertions were retained and expanded.

## Final verification

Latest source: **313tests passed,0failed,1,520assertions** across6test files, including all243 strict rating/match rubric cases. Standard domain typecheck, scoped test typecheck, scoped ESLint --no-ignore and both smokes passed. All source modules remain below200lines. Independent code review closed the missing-row finding:9.5/10,0unresolved findings. Docs/ownership audit passed for16source paths.

- Existing smoke: score75,looks_consistent; explicit configured award7; replay award null; car gap open.
- New public source/simulator smoke: aggregate flagtrue; coverage1/2 ->2/2 after contrary expiry/resolution ->0/2 after shared expiry. Explicit epoch bump yields0active old gaps while the historical row remains open.
- Public smoke seed SHA256: `8f28409ccc6db895ec35480455e17356ae9742f44020634619095b603be732b4`.
- Public smoke config SHA256: `2dfe0b778bab983d5621e07e249203e1fbb3db6f849369e560d7abacd9127f38`.
- Public smoke bundle SHA256: `60278fc04ea74c4d4a9ac97b24334e2d9ad7d5d82812d45f635694e4a4472221`.
- Evidence stdout is in the execution transcript; the two smoke entrypoints below reproduce the observed outputs. These identify a sealed synthetic functional fixture, not a calibrated D04 dataset or provider/device evaluation.

An amendment/manifest mismatch listed `test/gaps` only in the amendment. The uncommitted test was relocated to the already authorized `test/coverage` subtree before delivery, with no policy change. All final16source paths satisfy both matchers. Central rewards export, fixture dependency and coverage ignores were already supplied by Lead; tests now use public package entrypoints. No additional central file request is needed for this correction.

## Scope and continuation

Record correction of the partial07.03coverage and07.04/05/07gap/reward core. Keep full phase checkboxes and gates pending. The public consumer proof does not establish durable transaction/race/crash/auth behavior. No AI result can grant an award, human review, road opening or Execute through this slice. Current UI/API projections should call `projectActiveGaps` with authoritative scope and retain the full ledger for audit.

Full service, media, AI jobs/provider/router and actual atomic runtime require a fresh full-source continuation. No local correction blocker remains. No source normalization, wire change, central config edit, remote push/merge/deploy, account/key/resource creation, live provider, device or paid action occurred.

## SourceEvidence

```json
{
  "work_item_id": "review-rewards-domain-correction-v2",
  "role_id": "review-rewards",
  "base_sha": "223a58654210e934dfb1eda1092be33a7fdc30fe",
  "observed_launch_sha": "2364a58e271a738790fe2a70fd47f67ad0befb52",
  "status": "code-ready-for-integration",
  "contract_sha256": "bda263b1d21bfa26994d857da94f97b8974a3cfee08059e805e889f765202527",
  "changed_paths": [
    "apps/api/test/coverage/active-gaps.test.ts",
    "apps/api/test/coverage/scoped-correction-smoke.ts",
    "apps/api/test/coverage/scoped-coverage.test.ts",
    "apps/api/test/coverage/scoped-evidence-fixture.ts",
    "apps/api/test/coverage/useful-coverage.test.ts",
    "apps/api/test/rewards/fixtures.ts",
    "apps/api/test/rewards/lifecycle.test.ts",
    "apps/api/test/rewards/reward-proposal.test.ts",
    "apps/api/test/rewards/smoke.ts",
    "packages/domain/src/rewards/README.md",
    "packages/domain/src/rewards/active-gaps.ts",
    "packages/domain/src/rewards/coverage.ts",
    "packages/domain/src/rewards/current-evidence.ts",
    "packages/domain/src/rewards/index.ts",
    "packages/domain/src/rewards/report-evidence.ts",
    "packages/domain/src/rewards/validation.ts"
  ],
  "checks": [
    {
      "command": "bun run - (byte-safe startup preflight importing sha256 from tooling/orchestration/delivery-verifier-core.ts)",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "git merge --ff-only 2364a58e271a738790fe2a70fd47f67ad0befb52",
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
      "command": "bun run --cwd packages/domain typecheck",
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
      "command": "bun --bun run eslint --no-ignore packages/domain/src/rewards apps/api/test/review apps/api/test/rewards apps/api/test/coverage --max-warnings=0",
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
      "command": "bun run apps/api/test/coverage/scoped-correction-smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "git verify-commit e990fbaa3e273fda3fb362cf0b9f4e059dd52b61",
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
      "scenario": "Existing functional_fixture rubric + configured award + replay",
      "observed_result": "Rubric75/looks_consistent; configured award7; replay new_award=null; car gap stays open.",
      "result": "pass",
      "evidence_path": null
    },
    {
      "scenario": "Sealed synthetic public source/simulator per-vehicle consumer with bike-only contrary evidence",
      "observed_result": "Global aggregate flag=true; coverage1/2 initially,2/2 after contrary expiry at minute1 or public resolution,0/2 at minute3; explicit epoch bump excludes historical active gap without altering its open audit row.",
      "result": "pass",
      "evidence_path": null
    }
  ],
  "public_exports": [
    "@floodops/domain/rewards: new projectActiveGaps(ledger, currentScope): readonly Gap[]; immutable open current tuple projection preserving ledger order.",
    "@floodops/domain/rewards: corrected deriveUsefulCoverage and proposeReportReward semantics; existing signatures unchanged."
  ],
  "integration_requests": [
    "Use @floodops/domain/rewards projectActiveGaps(ledger, authoritativeCurrentScope) for current open-gap views/counts; keep ledger.gaps as immutable full audit history. No new package export or wire status is required.",
    "Continue full review/AI service/router/provider/durable composition only after a fresh full-source continuation receipt. Current correction consumes public pure knowledge/simulator ports and does not declare Sources-ready or review-ready.",
    "Keep explicit server-owned scope/epoch/time, normalized media bindings and positive configured award values when composing genuine acceptance plus gap/award transitions atomically."
  ],
  "blocked_prerequisites": [
    "This correction receipt explicitly defers durable report review, AI media/job/provider/router, scoped actor authorization, race/crash/idempotency and full backend composition until the genuine source-ready continuation.",
    "No live model/image-quality, device, preview/deployment, calibration or release evaluation occurred; known external prerequisites and dependency advisories are not waived."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "e990fbaa3e273fda3fb362cf0b9f4e059dd52b61",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```
