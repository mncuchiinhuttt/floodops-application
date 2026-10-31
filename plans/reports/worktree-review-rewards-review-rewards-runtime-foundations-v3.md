# ReviewRewards runtime foundations v3 — MVP handoff

Reachable source is ready for integration; two platform-dependent route enablements remain pending below. This is not full Phase07/review-ready/backend-ready.

## Identity and preflight

- Worktree `/Users/vominhlong/seahackathon-worktrees/07-review-rewards`, branch `feat/floodops-review-rewards`.
- Signed source C: `9160e8e9b2b5fc250913550e13f4026629751ccb`, direct child of exact launch `3b37b97bed01f39eeec1d4201e12f2b12d30e266`; Good git ED25519 signature verified. Report commit is supplied out of band.
- Preserved clean prior R `326fe8f31ca91c8d3dbfcb92a16a5d25c184d32e`; authorized fast-forward to exact launch. Base `c335056c7aec373ef5ebec2d66bd46ce820746a3`.
- Receipt `worktree-execution/launch/review-rewards/review-rewards-runtime-foundations-v3.json`; amendment `independent-business-runtime-v1`.
- Policy commit `aea042b5fdb5100e826672111f326d3a03847ee7`, hash `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`.
- Contract index at base, hash `b333867a263b3627da685a21f0e35da9b1baadfdafc0cc6f9d45d745d37d28fa`, indexed source `10485a74d7b4961a47e38987b4c4e195df7e4e4f`.
- Verified required-gate ancestry, metadata-only base/launch delta, policy/index and all677 raw-byte artifact hashes at source/index/launch. Frozen Bun1.4.0 install --ignore-scripts checked1261 packages with no changes. Actual model/effort/tier self-verification unavailable.
- Only25owned paths changed:24new API feature/test files and own unit-test tsconfig. No central manifest/config/lock/index, source core, policy/schema/receipt/gate edit. Tests use own local Workerd/R2 configuration with synthetic keys, remoteBindingsfalse; no copied credentials/env/state or remote account action.

## Implemented MVP behavior

- Genuine synchronous human Accept reducer composes public source acceptance, per-vehicle observations/current knowledge, conflict occurrences, gap/reward ledger, report award pointer and decision audit into one DO transition. Platform commits values/events/idempotency atomically. Model work is outside this transaction.
- Genuine conflict resolution passes an exact canonical tuple to the public source seam and threads one reward ledger through deterministic kept-report order. Driver impassable -> citizen normal -> conflict -> actual HTTP resolution yields one configured award7, with exact replay preserving the committed result.
- Initial gaps are seeded at sequence0 from actual initial coverage. New coverage-loss gaps open in acceptance/resolution, and exported reconcileReviewGaps composes expiry/epoch openings inside source/clock transactions. The actual Workerd clock fixture exercises this at minute6: the functional fixture deliberately supplies fresh evidence at3 through6, so the test uses the real exclusive expiry without suppressing the producer event. Prior points are retained.
- Dispatcher award reads use a signed cursor bound to session/generation/revision/limit. Contributor dashboard selects authenticated bound entity and returns only its reports/awards/points. No client principal selector or raw hash/media is exposed.
- Persisted image binding uses server SHA256 and actual normalized media/report/model/rubric context, excluding unrelated operational revision. Synchronous DO binding resolver performs no R2/provider awaits. Service checks normalized byte hash/digest/description before one-use durable start; strict provider output is revalidated and server rubric derived, then completion goes through current-job/lease/deadline/generation binding.
- Native-fetch Responses adapter has a fixed official endpoint, one normalized image, no tools, separate fixed developer instructions/untrusted user evidence, strict self-contained C1 output schema, bounded UTF8/JSON, typed refusal/incomplete/error handling and no retries. No raw staging or public media URL fallback exists.
- AI changes only durable metadata/events. Manual Accept succeeds while a job runs or has invalid output; late completion is discarded/superseded and cannot rollback knowledge or create a second award. Result absence stays null, never fake0.

## Actual final evidence

- **16/16 Workerd tests across2files**, using actual Hono routes, SQLite SessionDO, public Source submission/acceptance/resolution and simulator transitions. Test source/media adapter is explicitly synthetic; it never replaces a production source with canned successful review.
- **329unit tests passed,0failed,1,616assertions across7files**, including the frozen243rubric combinations and16provider-adapter tests using fake transport only.
- API strict typecheck, focused Workerd-test typecheck, focused unit-test typecheck and scoped ESLint all passed. Every code file is below200lines. Core review9.5/10 with0unresolved findings in reachable implemented paths; docs/ownership audit passed.
- Essential runtime cases: atomic persistence/exact replay/eviction, CAS race200/412, duplicate normalized photo across contributor entities with full rollback, actual conflict resolution/replay, expiry without clawback, principal/role privacy, real Reset fencing and fresh generation, durable advisory reservation/start/completion/reuse/deadline/eviction, forbidden output and late human decision, and one-call service/Responses transport.
- DO smoke asserts accepted status, revision+1, one award7, one gap fill in actual stored state. Runner did not forward its console.info line, so there is no claim of captured smoke stdout. The executable Workerd command below launches and exercises the changed public HTTP/runtime path.
- All data are project-authored synthetic functional fixtures. No real vision quality, provider compatibility/account/Images transform, device, calibration or deployed-backend acceptance is established.

## Exact pending actions and continuation

1. Enable metadata-only Reject. Target: SessionPlatform ReducerDefinition/command CAS enforcement. Current static operational flag couples If-Match and revision increment; audit-only Reject needs atomic CAS without changing operational revision. The actual reject transition is implemented, but its registered HTTP command returns503CONFIG_INCOMPLETE until the owner supplies that separate capability. State: pending dependency, not denied or attempted bypass. No HTTP pre-read CAS race or unsigned configuration workaround was used.
2. Enable image-review POST. Target: SessionPlatform image job metadata client/handler. A queued job cannot currently fail before start, while start increments call budget. The typed QueuedImageFailurePort needs a genuine lease/current-binding/generation/deadline-fenced terminal-error implementation without consuming a provider call. POST stays503CONFIG_INCOMPLETE until supplied; GET/direct genuine metadata/service success paths are implemented and tested. State: pending dependency, not denied. No artificial start, silently converted storage timeout, fake advice or fake budget proof.
3. Lead adopts the real Sources factory through the explicit SourceReviewPort and normalized image reader/prepared metadata, mounts routers/registry and composes gap reconciliation in actual source/advance reducers. Frozen SOURCE_SCOPE_INCOMPATIBLE failures remain controlled503 rather than a copied/forked normalization rule.

MVP priority kept checks to essential correctness/security paths; broader cross-client E2E, complete IR01-IR11 surface matrix, IR12 live vision, device/accessibility/performance and production release gates remain deferred. No push/main merge/deploy, account/key/resource creation, paid provider, EAS/device/store or external messaging occurred.

## SourceEvidence

```json
{
  "work_item_id": "review-rewards-runtime-foundations-v3",
  "role_id": "review-rewards",
  "base_sha": "c335056c7aec373ef5ebec2d66bd46ce820746a3",
  "observed_launch_sha": "3b37b97bed01f39eeec1d4201e12f2b12d30e266",
  "status": "code-ready-for-integration",
  "contract_sha256": "b333867a263b3627da685a21f0e35da9b1baadfdafc0cc6f9d45d745d37d28fa",
  "changed_paths": [
    "apps/api/src/features/knowledge/conflict-review/resolve-transition.ts",
    "apps/api/src/features/reports/review/README.md",
    "apps/api/src/features/reports/review/image/binding.ts",
    "apps/api/src/features/reports/review/image/image-review-port.ts",
    "apps/api/src/features/reports/review/image/responses-image-review.ts",
    "apps/api/src/features/reports/review/image/router.ts",
    "apps/api/src/features/reports/review/image/service.ts",
    "apps/api/src/features/reports/review/index.ts",
    "apps/api/src/features/reports/review/review-transition.ts",
    "apps/api/src/features/reports/review/router.ts",
    "apps/api/src/features/reports/review/runtime-types.ts",
    "apps/api/src/features/reports/review/state.ts",
    "apps/api/src/features/rewards/pagination.ts",
    "apps/api/src/features/rewards/views.ts",
    "apps/api/test/review/responses-image-review.test.ts",
    "apps/api/test/review/runtime/README.md",
    "apps/api/test/review/runtime/image.workerd.ts",
    "apps/api/test/review/runtime/review.workerd.ts",
    "apps/api/test/review/runtime/runtime-fixtures.ts",
    "apps/api/test/review/runtime/runtime-worker.ts",
    "apps/api/test/review/runtime/source-fixture.ts",
    "apps/api/test/review/runtime/tsconfig.json",
    "apps/api/test/review/runtime/vitest.config.ts",
    "apps/api/test/review/runtime/wrangler.review.jsonc",
    "apps/api/test/rewards/tsconfig.json"
  ],
  "checks": [
    {
      "command": "git merge --ff-only --no-stat 3b37b97bed01f39eeec1d4201e12f2b12d30e266",
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
      "command": "node node_modules/vitest/vitest.mjs run --config apps/api/test/review/runtime/vitest.config.ts",
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
      "command": "bun --bun run tsc --noEmit -p apps/api/test/review/runtime/tsconfig.json",
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
      "command": "bun test apps/api/test/review apps/api/test/rewards apps/api/test/coverage",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun --bun run eslint --no-ignore apps/api/src/features/reports/review apps/api/src/features/rewards apps/api/src/features/knowledge/conflict-review apps/api/test/review --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/07-review-rewards",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "git verify-commit 9160e8e9b2b5fc250913550e13f4026629751ccb",
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
      "scenario": "Actual Hono HTTP + SQLite SessionDO + public source/simulator with declared synthetic source/media adapter",
      "observed_result": "HTTP Accept and stored SQLite state assert accepted report, operational revision +1, one award7, one filled gap; exact replay and eviction preserve one outcome; CAS race yields200/412. Smoke console line exists but runner did not forward it; these are actual state assertions, not captured stdout.",
      "result": "pass",
      "evidence_path": null
    },
    {
      "scenario": "Actual image service + durable metadata + explicit fake Responses transport",
      "observed_result": "One transport call; strict model output produces score75; metadata running/completed retains operational revision and report/reward values; same/current input reuses job; manual Accept supersedes late output. No live model.",
      "result": "pass",
      "evidence_path": null
    }
  ],
  "public_exports": [
    "apps/api/src/features/reports/review/index.ts: createReviewRuntime, createReviewRouter via returned router; createReviewSeed, reconcileReviewGaps, reviewReportTransition, resolveConflictTransition; SourceReviewPort, ReviewOptions and registry constants.",
    "Image exports: prepareImageReviewBinding/imageContextKey; createImageReviewRouter; runImageReview; createResponsesImageReviewPort; ImageReviewPort/ImageReviewMediaPort/QueuedImageFailurePort and config types."
  ],
  "integration_requests": [
    "Lead: compose createReviewRuntime({source,rewards,imageConfig}) commands/views/imageBinding and router. Registry keys: review:accept, review:reject, review:resolve, review:awards, review:image-context and contributor-dashboard. Do not expose internal views directly.",
    "SourcesMedia/Lead: adopt the explicitly injected synchronous SourceReviewPort to read/apply canonical public source/report state and original submitter/captured epochs. Source.apply must preserve other values and genuine simulator representation. No new wire or frozen producer signature is claimed.",
    "Source seed loader: persist createReviewSeed(initialCoverage) as seed.values.reviewRewardsSeed. Source/advance reducers must compose reconcileReviewGaps after deriving current epoch/time/knowledge in the same transaction, with matching event sequence. The actual local Workerd clock composes it; genuine production composition remains required.",
    "SourcesMedia: call prepareImageReviewBinding outside DO transaction and persist prepared digest/context with normalized owned media metadata; supply authorized ImageReviewMediaPort byte reader. Lead injects image config/provider only under actual authorization.",
    "SessionPlatform: add independently enforced metadata CAS (e.g. requiresRevision flag independent of operational) in ReducerDefinition/command. Then register the implemented reject transition as metadata-only with atomic If-Match; review:reject currently503CONFIG_INCOMPLETE.",
    "SessionPlatform: add a current-binding/generation/lease/deadline-fenced pre-start terminal error hook for queued jobs without increasing image_calls. Existing complete requires started; inject genuine QueuedImageFailurePort into createImageReviewRouter. Until then image POST503CONFIG_INCOMPLETE, no artificial model start."
  ],
  "blocked_prerequisites": [
    "PENDING DEPENDENCY, not denied: enabling POST reports/{report_id}/reviews decision=reject is blocked by the metadata-CAS seam in apps/api/src/shared/platform-types.ts and session-runtime/transitions.ts. Pure reject transition exists; HTTP refuses503 until atomic CAS and no operational revision can both be enforced.",
    "PENDING DEPENDENCY, not denied: enabling POST reports/{report_id}/image-review-jobs is blocked by queued pre-provider failure handling in session-runtime/image-jobs.ts and shared/session-client.ts. Complete rejects unstarted job; start consumes provider budget. Real service/provider and GET/metadata paths exist; no fake start or silently relabeled storage failure is used.",
    "Full genuine Sources/media factory and source/advance composition, Sources-ready/review-ready/backend-ready, web/native E2E and IR12 live vision remain unclaimed. Frozen public Source reconcileEvidence SOURCE_SCOPE_INCOMPATIBLE is surfaced as503CONFIG_INCOMPLETE rather than bypassed.",
    "No paid provider, device, preview/deploy, calibration or release evidence was performed. Existing external prerequisites/advisories are not waived."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "9160e8e9b2b5fc250913550e13f4026629751ccb",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```
