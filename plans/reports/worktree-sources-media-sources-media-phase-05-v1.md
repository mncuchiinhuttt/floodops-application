# SourcesMedia v1 safe checkpoint — SourceEvidence

Parent explicitly requested preserving active WIP before the v2 producer cutover. This is a historical checkpoint, not sources-ready or full phase completion. Continue in the same worker under v2 after receipt verification and exact merge.

- Own branch/worktree verified; clean signed source C `e1181a7d33f9f81360afd05b570c8a33f25e33a1` preserves all prior signed partial history.
- Old exact launch `123c68b053dab6b4deaa86a7e280c8ed1ebce43a`; policy b0aa40df and index710364ea verified, all425 raw artifacts pinned. Required predecessors were ancestor-verified.
-63 owned files implement the actual20operation Source API, actor-bound reports, configured deterministic quick path, historical capture epochs, private media, real JPEG/PNG decoding/EXIF stripping/orientation and server-only normalized-image/digest port. Source public DTO/API/tool totals unchanged.
- Pure focused suite51pass/175assertions and actual Workerd suite24pass across5files. Real SQLite DO, private R2 and local Images; no fake provider. Strict API/domain/source/media types and scoped lint passed. Controlled failure/history injection proves auth/privacy/CAS/replay, source units/closure/epoch, metadata/limits, unique-writer takeover, stale completion, Reset, delete outage, late writes and crash-after-attachment compaction.
- Signed source commit verified; source files below200lines; no central/protected/other-owner writes, remote push, deploy, paid/model/account/key/device action. Model/tier runtime metadata remains unverified.
- Earlier recoverable failures were corrected: test asset path, missing Reset confirm, strict buffer/scenario types, canonical error mapping, replay-before-effects, orientation/service-error mapping and capture-epoch provenance. No safety assertion weakened.
- Local HTTP smoke is implemented but execution is deferred until after v2 cutover. No source gate or E2E/device/model/security/release completion claimed.
- Public factory and lifecycle documentation: `apps/api/src/features/sources/README.md`, `apps/api/src/features/media/README.md`.
- Canonical driver source is missing; its actual route fails CONFIG_INCOMPLETE, while the separately sealed synthetic driver scenario passes deterministic quick/text/mapping/closure/epoch tests. Lead/SimulationData must publish the canonical source/profile mapping before full acceptance.
- Legacy mixed-vehicle guard remains in this old-baseline checkpoint as instructed. Parent supplies integrated simulator correction in exact v2 launch `2364a58e271a738790fe2a70fd47f67ad0befb52`; adopt only after this signed checkpoint.

```json
{
  "work_item_id": "sources-media-phase-05-v1",
  "role_id": "sources-media",
  "base_sha": "3cebe9e8d8b4fd4fd11cd319b1549952c119caa5",
  "observed_launch_sha": "123c68b053dab6b4deaa86a7e280c8ed1ebce43a",
  "source_sha": "e1181a7d33f9f81360afd05b570c8a33f25e33a1",
  "status": "blocked",
  "contract_sha256": "710364ea3b11b6491d60ca256ff3c9c41719c6663ce6e3280bb811e401d9d21b",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a",
  "changed_paths": [
    "apps/api/src/features/knowledge/index.ts",
    "apps/api/src/features/knowledge/projection.ts",
    "apps/api/src/features/knowledge/router.ts",
    "apps/api/src/features/media/README.md",
    "apps/api/src/features/media/bounded-bytes.ts",
    "apps/api/src/features/media/http-state.ts",
    "apps/api/src/features/media/index.ts",
    "apps/api/src/features/media/jpeg-orientation.ts",
    "apps/api/src/features/media/jpeg-shape.ts",
    "apps/api/src/features/media/media-commands.ts",
    "apps/api/src/features/media/media-state.ts",
    "apps/api/src/features/media/media-types.ts",
    "apps/api/src/features/media/normalize-image.ts",
    "apps/api/src/features/media/normalized-image-port.ts",
    "apps/api/src/features/media/png-shape.ts",
    "apps/api/src/features/media/recovery-store.ts",
    "apps/api/src/features/media/router.ts",
    "apps/api/src/features/media/session-object.ts",
    "apps/api/src/features/media/upload-service.ts",
    "apps/api/src/features/media/write-reducers.ts",
    "apps/api/src/features/reports/capture-epochs.ts",
    "apps/api/src/features/reports/index.ts",
    "apps/api/src/features/reports/report-context.ts",
    "apps/api/src/features/reports/router.ts",
    "apps/api/src/features/reports/runtime.ts",
    "apps/api/src/features/scenario-assets/index.ts",
    "apps/api/src/features/scenario-assets/router.ts",
    "apps/api/src/features/scenario/domain-errors.ts",
    "apps/api/src/features/scenario/http.ts",
    "apps/api/src/features/scenario/index.ts",
    "apps/api/src/features/scenario/pagination.ts",
    "apps/api/src/features/scenario/ports.ts",
    "apps/api/src/features/scenario/public-http.ts",
    "apps/api/src/features/scenario/router.ts",
    "apps/api/src/features/sources/README.md",
    "apps/api/src/features/sources/feature.ts",
    "apps/api/src/features/sources/index.ts",
    "apps/api/src/features/sources/router.ts",
    "apps/api/src/features/sources/runtime.ts",
    "apps/api/test/media/helpers.ts",
    "apps/api/test/media/image-fixtures.ts",
    "apps/api/test/media/lifecycle.test.ts",
    "apps/api/test/media/limits-and-decode.test.ts",
    "apps/api/test/media/localhost-smoke.ts",
    "apps/api/test/media/port-races.test.ts",
    "apps/api/test/media/recovery.test.ts",
    "apps/api/test/media/runtime-worker.ts",
    "apps/api/test/media/source-api.test.ts",
    "apps/api/test/media/tsconfig.json",
    "apps/api/test/media/vitest.config.ts",
    "apps/api/test/media/wrangler.jsonc",
    "apps/api/test/observations/current-knowledge.test.ts",
    "apps/api/test/observations/pipeline.test.ts",
    "apps/api/test/observations/report-proposals.test.ts",
    "apps/api/test/sources/normalization.test.ts",
    "apps/api/test/sources/source-pipeline-smoke.ts",
    "apps/api/test/sources/test-context.ts",
    "apps/api/test/sources/test-tsconfig.json",
    "packages/domain/src/reporting/index.ts",
    "packages/domain/src/reporting/report-validation.ts",
    "packages/domain/src/reporting/sources-state.ts",
    "packages/domain/src/sources/README.md",
    "packages/domain/src/sources/source-types.ts",
    "plans/reports/worktree-sources-media-sources-media-phase-05-v1.md"
  ],
  "checks": [
    {
      "command": "bun test apps/api/test/sources apps/api/test/observations",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v1.md"
    },
    {
      "command": "bun --bun node_modules/vitest/vitest.mjs run --config apps/api/test/media/vitest.config.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v1.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/media/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v1.md"
    },
    {
      "command": "scoped ESLint all Source domain/features/tests --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v1.md"
    },
    {
      "command": "git verify-commit e1181a7d33f9f81360afd05b570c8a33f25e33a1",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v1.md"
    }
  ],
  "smoke": [],
  "public_exports": [
    "apps/api/src/features/sources/index.ts:createSourcesFeature/createSourcesRegistry/createSourcesRouter",
    "apps/api/src/features/media/index.ts:createSourcesSessionObject/createMediaRegistry/createMediaRouter/createNormalizedImagePort/normalizedImageBinding/verifiedFixture",
    "apps/api/src/features/scenario/index.ts; knowledge/index.ts; reports/index.ts; scenario-assets/index.ts"
  ],
  "integration_requests": [
    "Parent-requested safe checkpoint before exact v2 launch2364a58e271a738790fe2a70fd47f67ad0befb52. Preserve this C/R and merge exact launch, no reset/stash/rebase.",
    "Lead must compose COMBINED registry through createSourcesSessionObject recovery wrapper and register feature.routers; no central edit performed.",
    "Canonical frozen scenario still has no configured driver source; separate authored test proves implementation. Driver fixture/config publication and fresh adoption remain required."
  ],
  "blocked_prerequisites": [
    "v1 superseded by explicit safe-checkpoint baseline update; legacy Source_SCOPE guard still intentionally present in this historical checkpoint.",
    "Actual loopback smoke script implemented but not yet executed; media transformation is proven by real Workerd/R2/Images tests.",
    "No production entitlement/provider/device/calibration/release claim."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false
}
```
