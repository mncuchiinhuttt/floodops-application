# SourcesMedia phase05 v2 — SourceEvidence

**Coherent API/media implementation ready for immediate integration. Full sources-ready is blocked solely by canonical driver-source configuration and Lead composition/acceptance.** No gate was self-published. The exact pending action is described below; remaining implementation continued independently.

## Source, startup and safe cutover
- Final source C `15f415b4d5096eda64b0740f41259ced53f04d49`, signed and verified with existing identity/config. C contains64 owned changed paths relative to exact launch `2364a58e271a738790fe2a70fd47f67ad0befb52`.
- BASE `223a58654210e934dfb1eda1092be33a7fdc30fe`; contract index hash `bda263b1d21bfa26994d857da94f97b8974a3cfee08059e805e889f765202527`; pinned policy hash `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a` unchanged. All654 raw-byte artifacts at source/index/launch and all required gate ancestry verified. The repeated identical UI gate in Lead metadata was checked but not edited.
- CWD `/Users/vominhlong/seahackathon-worktrees/05-sources-media`, branch `feat/floodops-sources-media`. Parent explicitly authorized this active-worker checkpoint/cutover, no second writer.
- Preserved signed v1 checkpoint C `e1181a7d33f9f81360afd05b570c8a33f25e33a1` and direct report R `b563f80a52b7580d489a4252b0aaaad8a6298a6b`; canonical v1 delivery verifier passed64paths. Own newly generated v1 working-tree report was then removed by signed `5786a24` to retain its evidence in Git history without introducing a foreign work-item report namespace in v2. Source WIP was preserved, not reset/stashed/rebased. Exact v2 launch signed-merged as `a3c358d3a0853122a649a96705bab546cfcd4513`.
- Frozen Bun1.4.0 install --ignore-scripts passed (67newly required cached packages after this baseline). No central manifest/lock/config/aggregate export/policy/gate or excluded review subtree edited. Model/tier metadata not exposed and unverified.
- No remote push/deploy/provision/account/key/paid provider/model/Images/device/store action. Actual local server used127.0.0.1:8785, isolated own ignored state, local-only R2/SQLite/Images and synthetic public test keys; it was stopped after smoke.

## Implemented operations and ports

All20 owned canonical operations have real feature routes and registered runtime behavior: public scenario catalog/version; session graph/configuration; sources/list/detail/events/replay; knowledge/observations/current restrictions/apply configured restriction; report submit/list/detail; media reserve/PUT/completion/private read; frozen licensed fixture read. C1 remains66API194schemas8Commander tools. Review/conflict/reward/AI job orchestration is excluded and preserved for ReviewRewards.

- Injected frozen catalog and public SimulationPersistence, no app-entrypoint import cycle or graph/config duplication in checkpoints. Full values replacement preserves unrelated owner state. Registered synchronous reducers, serialized RPC only, no R2/Images/model await inside a transaction.
- Server capability/permission/Origin/CSRF/participant ownership, current CAS and idempotency paths are exercised. Driver map knowledge is own vehicle/route scope, contributor reports/media own participant, viewers sanitized source/knowledge only. Binary c.newResponse preserves middleware no-store/nosniff/CSP/CORS.
- Common envelopes check strict source/fixture/role/provenance, units/datum/time/location/availability. Actual source API returns normalized values. Context never becomes street depth/passability. Closures/reopening/epoch/freshness remain deterministic, low coverage does not grant route approval, pending photo does not change knowledge or award.
- Report actual received_at uses injected wall time while capture/TTL stays simulation-bound; historical capture epoch comes from authoritative scenario/runtime incident history, so late evidence cannot inherit a newer incident. Strict identity keeps actual submitter separate from explicitly selected simulated entity. Quick report is model-free when driver source configured; disabled text normalization yields explicit needs_clarification, never fake AI success. Citizen normalization always pending until human review. Duplicate normalized media/repeated reports are flagged and never award here.
- Integrated exact SimulationData per-scope correction; temporary SOURCE_SCOPE_INCOMPATIBLE guard removed only on this new receipt. Actual public consumer tests prove shared global flags can conflict for bike while car stays known, with closure/expiry/resolution/order-independence and unchanged operations/no awards.
- Actual bounded JPEG/PNG parser+decoder pipeline:5MiB streamed bytes independent of Content-Length,4096per-side, byte/type/CRC/segment/end validation, animation/SVG/HTML/truncation rejection, real Images decode/reencode, metadata/EXIF stripping and mobile orientation6. Hash is server-computed from actual normalized bytes; missing/broken decoder controlled503, content/size guards retain422/413, no raw fallback.
- Per-writer unique keys, atomic60second resource lease/fence, durable own recovery table and alarm wrapper. Intent precedes external write and exact platform media_keys registration. Stale takeover cannot overwrite/attach/fail replacement; Reset and failed deletes retain retry, uncertain crashes retain deletion tombstones, successful stopped writers compact safely, and exact completed retries do not grow outbox rows. Crash after attach before compaction preserves the live derivative and replay compacts. SCENARIO_ASSETS never enters session cleanup.
- Server-only dispatcher normalized-image port verifies pending report/session/generation/owned ready derivative/hash, returns bounded verified bytes+minimal context, rejects duplicates and reauthorizes after awaits. It never invokes vision, accepts/rejects reports, changes TTL/confidence/vehicles, awards or Executes.

## Actual validation

- **52 pure tests,187 assertions,0fail** across4files on the corrected producer.
- **25 actual Workerd tests,0fail** across5files on v2. Real registered SQLite DO, native/web credentials/CSRF, isolated private R2 buckets and actual local Images. Controlled failure/history states test recovery races; they do not pretend missing other-role endpoints were invoked.
- Strict API/media test types, source test/domain types, scoped ESLint and whitespace passed. All code files below200lines; independent bounded ownership/realpath/public-interface audit passed64paths, no central/excluded/old-report namespace diff. Read-only tester/reviewer helpers did not write source.
- Actual loopback HTTP smoke ran at exact signed C with Node26.8.1-hosted Wrangler4.156.0 (repo-approved CLI exception) and Bun client. Request chain201create/201reserve/200PUT/201complete/200privateGET/201pendingReport passed. Server stopped afterward; credentials never printed.
- Earlier recoverable failures are documented, not waived: initial test fixture path/Reset confirm/strict typed-buffer errors corrected; missing .vite-temp write permission rerun with authorized own-worktree scope; Bun-hosted Wrangler returned a forwarding503 because Bun fetch lacks undici dispatcher, corrected to the repository-prescribed Node host. API error mapping, replay-before-effects, capture epoch, per-writer takeover, EXIF orientation and explicit decoder guard errors were fixed with meaningful regressions. No safety assertion deleted or loosened.

Exact HTTP result:
```json
{
  "transport":"actual loopback HTTP/Workerd",
  "calibration":"incomplete",
  "seed_hash":"a5ed2d18708f37f1021225af64236140b32f43d19e902558b2f4bb9ebbdc56c9",
  "config_hash":"2dfe0b778bab983d5621e07e249203e1fbb3db6f849369e560d7abacd9127f38",
  "graph_hash":"a5bf0eb6d7e57bc3f80fd11571cf21d19d870da91d56cac34b62191859f2c86c",
  "media":{"byte_length":226,"width":64,"height":48,"sha256":"aa57ed641867ee23887b203056805bc7cf3fc4f78b65b96db46e2a9e84a3a8d9"},
  "report_status":"pending_review","observation_count":0,"award_id":null,
  "security_headers":true,"cors_origin":"https://floodops.test"
}
```

## Exact pending blocker and integration actions

**Pending, not denied and not attempted out of scope:** publish canonical driver source/profile in `data/scenarios/functional-v1/manifest.json` and its `packages/test-fixtures/src/functional/scenario/source-fixtures.ts` producer, reseal hashes, issue refreshed receipt. Those paths are SimulationData-owned. Current canonical registry has zero driver sources; actual canonical POST driver report returns503CONFIG_INCOMPLETE. A separate sealed scn_drivercase1 explicitly configures the driver source and passes quick acceptance, text-unavailable, capture epoch, normalized units and scoped reopening tests. No confidence/TTL/source identity was invented to force canonical success.

1. Lead can merge this coherent full API/media slice immediately. Import createSourcesFeature from apps/api/src/features/sources/index.ts, inject scenarioCatalog and simulationPersistence, merge its registry into the combined registry, export SessionDO from feature.createSessionObject(combinedRegistry), and register feature.routers in createApp. Keep the recovery wrapper/table/alarm; plain createSessionObject loses durable late-write recovery.

2. SimulationData/Lead: publish a configured driver observation Source in canonical scn_functional1/v1 sourceSnapshot.sources, with a justified frozen low-confidence TTL/location profile, then reseal scenario/manifest hashes and issue a fresh SourcesMedia receipt. Current canonical bundle has ZERO driver sources and actual driver submission returns503 CONFIG_INCOMPLETE. Source code cannot alter owner-excluded fixture/data/config files or consume an unpinned producer. Separate sealed scn_drivercase1 tests prove deterministic quick/text/capture behavior.

3. ReviewRewards: consume createNormalizedImagePort(env).read(SessionRequestContext,reportId) plus normalizedImageBinding(snapshot,reportId) from media/index; combine the media digest with report/model/rubric context yourself. Keep dispatcher explicit action, model quota/lease/current-input and atomic human review/reward ownership. The port returns verified bytes/minimal report context and no raw/public URL.

4. Lead: optional focused script mappings for own media Vitest config and local smoke may be added centrally; no package/config/index was edited by this worker. Wrangler must use repository-approved Node26.8.1 host, Bun remains1.4.0 package/tests/scripts.

The code may be reviewed/merged as this coherent slice immediately. Full sources-ready/backend/frontend E2E remains unclaimed until configuration, central composition and required acceptance complete. Production entitlement/model/device/D04/security/release remain separate evidence.

## Machine-readable SourceEvidence
```json
{
  "work_item_id": "sources-media-phase-05-v2",
  "role_id": "sources-media",
  "base_sha": "223a58654210e934dfb1eda1092be33a7fdc30fe",
  "observed_launch_sha": "2364a58e271a738790fe2a70fd47f67ad0befb52",
  "source_sha": "15f415b4d5096eda64b0740f41259ced53f04d49",
  "status": "blocked",
  "contract_sha256": "bda263b1d21bfa26994d857da94f97b8974a3cfee08059e805e889f765202527",
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
    "packages/domain/src/knowledge/reconcile-evidence.ts",
    "packages/domain/src/reporting/index.ts",
    "packages/domain/src/reporting/report-validation.ts",
    "packages/domain/src/reporting/sources-state.ts",
    "packages/domain/src/sources/README.md",
    "packages/domain/src/sources/source-types.ts",
    "plans/reports/worktree-sources-media-sources-media-phase-05-v2.md"
  ],
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v2.md"
    },
    {
      "command": "bun test apps/api/test/sources apps/api/test/observations",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v2.md"
    },
    {
      "command": "bun --bun node_modules/vitest/vitest.mjs run --config apps/api/test/media/vitest.config.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v2.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/media/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v2.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/sources/test-tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v2.md"
    },
    {
      "command": "bun --bun run eslint packages/domain/src/sources packages/domain/src/knowledge packages/domain/src/reporting apps/api/src/features/scenario apps/api/src/features/scenario-assets apps/api/src/features/sources apps/api/src/features/knowledge apps/api/src/features/reports apps/api/src/features/media apps/api/test/sources apps/api/test/observations apps/api/test/media --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v2.md"
    },
    {
      "command": "bun apps/api/test/media/localhost-smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v2.md"
    },
    {
      "command": "git verify-commit 15f415b4d5096eda64b0740f41259ced53f04d49",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v2.md"
    }
  ],
  "smoke": [
    {
      "scenario": "Actual loopback HTTP/Workerd at exact signed source C: native synthetic session -> reserve -> streamed bytes -> actual Images decode/strip -> completion -> authorized private derivative -> citizen report",
      "observed_result": "201/200 chain passed; normalized PNG64x48/226bytes SHAaa57ed641867ee23887b203056805bc7cf3fc4f78b65b96db46e2a9e84a3a8d9; pending_review,0observations,award:null; security/no-store/nosniff/CORS retained; no token output.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-phase-05-v2.md"
    },
    {
      "scenario": "Actual public Simulation mixed-vehicle consumer correction",
      "observed_result": "Shared global-conflict observation: bike unresolved, car known; closures remain closed; explicit resolution/expiry preserve scope, operations and no award/Execute.",
      "result": "pass",
      "evidence_path": "apps/api/test/observations/pipeline.test.ts"
    }
  ],
  "public_exports": [
    "apps/api/src/features/sources/index.ts:createSourcesFeature/createSourcesRegistry/createSourcesRouter",
    "apps/api/src/features/scenario/index.ts:createScenarioRouter/SourcesPorts; knowledge/index.ts:createKnowledgeRouter; scenario-assets/index.ts:createScenarioAssetsRouter; reports/index.ts:createReportsRegistry/createReportsRouter",
    "apps/api/src/features/media/index.ts:createMediaRouter/createMediaRegistry/createSourcesSessionObject/createNormalizedImagePort/normalizedImageBinding/verifiedFixture/MediaBindings/MediaRecoveryRpc",
    "@floodops/domain/{sources,knowledge,reporting}: pure normalize/reconcile/proposals plus versioned SourcesMediaState/sourceState/StoredSourceReport/StoredSourceUpload"
  ],
  "integration_requests": [
    "Lead can merge this coherent full API/media slice immediately. Import createSourcesFeature from apps/api/src/features/sources/index.ts, inject scenarioCatalog and simulationPersistence, merge its registry into the combined registry, export SessionDO from feature.createSessionObject(combinedRegistry), and register feature.routers in createApp. Keep the recovery wrapper/table/alarm; plain createSessionObject loses durable late-write recovery.",
    "SimulationData/Lead: publish a configured driver observation Source in canonical scn_functional1/v1 sourceSnapshot.sources, with a justified frozen low-confidence TTL/location profile, then reseal scenario/manifest hashes and issue a fresh SourcesMedia receipt. Current canonical bundle has ZERO driver sources and actual driver submission returns503 CONFIG_INCOMPLETE. Source code cannot alter owner-excluded fixture/data/config files or consume an unpinned producer. Separate sealed scn_drivercase1 tests prove deterministic quick/text/capture behavior.",
    "ReviewRewards: consume createNormalizedImagePort(env).read(SessionRequestContext,reportId) plus normalizedImageBinding(snapshot,reportId) from media/index; combine the media digest with report/model/rubric context yourself. Keep dispatcher explicit action, model quota/lease/current-input and atomic human review/reward ownership. The port returns verified bytes/minimal report context and no raw/public URL.",
    "Lead: optional focused script mappings for own media Vitest config and local smoke may be added centrally; no package/config/index was edited by this worker. Wrangler must use repository-approved Node26.8.1 host, Bun remains1.4.0 package/tests/scripts."
  ],
  "blocked_prerequisites": [
    "PENDING canonical configured driver Source/profile + resealed fixture/hash/receipt from SimulationData/Lead; full sources-ready cannot be claimed while canonical quick driver returns CONFIG_INCOMPLETE. Code and all remaining20operation surfaces are ready for integration.",
    "PENDING Lead central router/class composition and full gate acceptance; worker does not publish a gate.",
    "Production Images entitlement, live text/vision provider, actual model-quality, native/device, D04/calibration/security/release evidence are unavailable and not claimed."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false
}
```
