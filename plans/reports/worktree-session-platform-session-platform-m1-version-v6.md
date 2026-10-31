# SessionPlatform SourceEvidence — M1 serialization fence and fresh Reset seed

Status: assigned v6 source-ready for IntegrationLead exact verification/merge. No M1/backend/frontend/native/model gate is self-published.

## Verified baseline and scope

- Role/work item: `session-platform` / `session-platform-m1-version-v6`.
- CWD: `/Users/vominhlong/seahackathon-worktrees/04-session-platform`; branch: `feat/floodops-session-platform`.
- Base `2a440311b4a8a78f1dc3303e7aa9c8c35d097f40`; exact v3 launch `c30dd59defde31e222e4a52416ad3e6f553d0bb0`, adopted by fast-forward preserving signed v5 history. Base→launch contains only15 approved launch/packet files. No moving integration HEAD, rollout-v1/v2 or sibling WIP was used.
- Receipt: `worktree-execution/launch/session-platform/session-platform-m1-version-v6.json`; amendment: `m1-wire-rollout-v3`; prompt: `launch/fast-packets/session-platform-m1-version-v6.md`.
- Policy commit/hash: `aea042b5fdb5100e826672111f326d3a03847ee7` / `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`.
- Contract index: `worktree-execution/contracts/m1-wire-rollout-v3-index.json` at declared base, SHA256 `90e923e9a92af548aefa38975eb3d177805521862ff68b7b16a423903eff82cd`; source `d6e5fdf541ddbb018d4778237196e54fc4a01ee7`. All1017 indexed raw artifacts verified at source/index/launch; base, policy and every required gate passed ancestry. Independent read-only audits confirmed ownership, paths, index/policy and implementation/test behavior.
- Snapshot declares197 frozen schemas,66 unchanged operations,8 internal services and zero model-callable tools; `contracts_ready:false`, M1 runtime cutover pending. Active generated source/surface and `contracts/m1-cutover.md` were used instead of preserved historical root artifacts.
- Signed source C: `29d7b8818df3b930ad8e21da279eb11c6bf61242` (`fix(platform): fence feature state by session serialization`); signature verified with unchanged identity/configuration.
- Source delta:15 owned files,237 insertions/12 deletions;14 code files below200 lines (maximum124), no protected/central/other-owner writes or symlink escape. Scope matches both original ownership and narrowed v3 amendment. This report uses the exact separately allowed evidence path.

## Public seam and actual behavior

The existing public `RuntimeRegistry` type now has optional properties:

```ts
serialization?: string;
seedForReset?: (previous: SessionSeed) => SessionSeed;
```

Lead should set `serialization: "m1-v1"` on its combined registry. The generic platform checks immutable `snapshot.seed.values.runtime_contract.serialization`; a mutable values marker cannot upgrade a legacy session. Unconfigured standalone registries retain existing behavior without any domain marker.

Authentication/permissions precede the version fence on feature paths. Commands, projections and all image metadata operations fail with canonical `503 CONFIG_INCOMPLETE` before invoking feature callbacks or returning cached legacy feature replies. Existing matching-version exact replay still precedes new CAS/reduction; old outcomes remain stored rather than reinterpreted. No public field, operation signature, model tool or schema was added. The existing v5 `requireCas`/`imageReview.failQueued` hooks are reused unchanged.

Image/lease background reconciliation skips incompatible serialized state and feature callbacks. Scheduling also ignores those retained feature deadlines so an expired legacy lease cannot cause a1ms alarm loop. Generic identity/session metadata, capability management, role-safe events/streams, idle/absolute expiry, cleanup and explicit Reset remain available. The fence does not rewrite, relabel, auto-award or automatically Reset/delete old feature data; normal explicit Reset/expiry semantics remain intact.

For an explicit new Reset, optional pure `seedForReset` selects a fresh server-owned initial seed after authentication/CAS and only after existing-intent recovery has been ruled out. It runs synchronously in the transaction with a cloned previous seed. The platform rejects thenables, malformed values/entities, marker mismatch and changes to frozen scenario ID/version/horizon/calibration before writing the lock/intent. No network/provider/R2 I/O or old operational/report/reward migration runs there. The selected seed is persisted in the saga, so initialization failure/retry uses the exact chosen seed/target without rerunning the resolver. Without a resolver, an already matching initial seed may be reused; a legacy seed fails closed rather than acquiring a new marker.

Required Lead-owned composition: set the serialization property and, when supporting Reset from legacy serialization, supply a synchronous fresh-seed factory from the same frozen scenario catalog. The existing async `loadSessionScenario` cannot be passed directly as this synchronous resolver. Unsupported historical scenario versions should fail explicitly or use a separately created supported session, never be silently mapped to another scenario. The worker did not duplicate or edit central composition.

## Actual checks and evidence

Commands ran on the source state committed as C, in the assigned worktree with local frozen dependencies/state. No whole-repository build/lint/watch or remote action ran.

| Command / CWD | Result |
|---|---|
| `bun install --frozen-lockfile --ignore-scripts` / root | PASS; checked1102 installs across1261 packages, no changes or lifecycle scripts. |
| `bun --bun run vitest run test/commands/serialization-fence.test.ts test/expiry/serialization-lifecycle.test.ts test/reset/serialization-reset.test.ts` / `apps/api` | PASS,18 new cases across3 files. |
| `bun --bun run vitest run` / `apps/api` | PASS,147 tests across18 files; all129 prior capability/CAS/image/Reset/expiry regressions retained plus18 new cases. Actual duration191.17s under concurrent host load. |
| Scoped ESLint on all13 changed TypeScript implementation/test files, `--max-warnings=0` / root | PASS. |
| `python3 apps/api/test/commands/metadata-cas-smoke.py --versioned` / root | PASS; actual local Hono/Workerd/SQLite HTTP on127.0.0.1:8784, own isolated state/process, credentials in memory only, no provider calls. |
| `bun --bun run tsc --noEmit -p test/commands/platform-tsconfig.json` / `apps/api` | BLOCKED/FAIL by transitive Sources `packages/domain/src/reporting/submit-report.ts:14` TS2739 missing new required Report fields; no platform diagnostics. Existing strictness/includes were preserved. |
| `bun run --cwd apps/api typecheck` / root | BLOCKED/FAIL by the four baseline migration diagnostics listed below; no platform diagnostics. |
| Ownership/real paths/line limits, `git diff --check`, signature verification | PASS. |

The new Workerd cases prove configured current/missing/legacy/null/mutable-only markers; unconfigured generic behavior; old feature state and cached replies fail closed without mutation; authorized identity/meta/events remain available; matching replay after later operational revision remains byte-exact and precedes CAS; the new and retained actor/Origin/CSRF/transport guards still fail unauthorized requests. Image read/reserve/start/complete/failQueued cannot consume old state, publish output or charge the counter. Expired legacy image/lease records survive background reconciliation unchanged without an alarm spin; ordinary session expiry still fences access. Explicit Reset discards prior operational/report state only in the new session, selects valid M1 initialization, rejects invalid/async/missing resolver cases before an intent, and recovers a persisted target after actual initialization failure without rerunning a now-throwing seed factory.

The HTTP smoke uses the test-only configured registry/fresh synthetic scenario, not production feature serializers. It observed missing428/stale412/current200 CAS, unchanged metadata revision0, exact replay after operational revision1, changed-body409, two events and preserved `nosniff`. An explicit Reset produced generation1/revision0 with fresh counter0; the prior session became410. This proves the actual generic adapter/DO seam, not production frontend/model/device E2E.

Compiler blockers, all byte-for-byte unchanged from exact launch C30:

- Results `apps/api/src/features/evaluations/pure/aggregate-evaluation.ts:31`: TS2339, old `model_config_hash` instead of `planner_config_hash`.
- Planner `apps/api/src/features/planning/job-leases.ts:28`: TS2322, old planning `MODEL_TIMEOUT` versus M1 deterministic failure enum.
- Planner `apps/api/src/features/planning/job-transitions.ts:44`: TS2322, same old timeout enum.
- Sources `packages/domain/src/reporting/submit-report.ts:14`: TS2739, missing `reward`, `review_result_id`, `reviewed_at` on Report.

These exact owners must complete their assigned migrations; the worker neither waived the checks nor changed their implementation. The prior Review TS2367 was already fixed in this launch.

Configuration/fixture SHA256 at C:

- `apps/api/vitest.config.ts`: `e5a46f60f6e19afac378809957a3a17b8e9d04eea35a68e29be8c4630b58e70d`.
- `apps/api/wrangler.test.jsonc`: `0df2661d25dc5b5fd61c7e3d109c8d5829bcf8731409ccfcfdb0c64daa7eaafe`.
- `apps/api/test/runtime-worker.ts`: `ae13d8d9494e5ea808ce8442418dee50b5fe4b1dd48d51722c65adf544452297`.
- `apps/api/test/commands/versioned-registry.ts`: `ddff039e35b687a1a76841b053a0d8497c1d3ed694b107225885302815342808`.
- `apps/api/test/commands/platform-tsconfig.json`: `7269a117990041a358054befc7ba9fb843d463d5c2928b77152912d59a76eac2`.
- `apps/api/test/commands/metadata-cas-smoke.py`: `90d2e32330e5cf7b6933833db7ddca3fcc539bf33b5808ac31590ee7c0a75bfe`.
- `bun.lock`: `0a023618337aa31cf3ea7b12cd14939d6e8aecaf60f63da1a4239daae26a2dbf`.

## Transport recovery and delivery limits

The execution transport disconnected during the first stage/commit attempt. Recovery first read exact HEAD/status/log/index: launch C30 was still HEAD, index empty, and all15 intended files remained; the failed command had not staged or committed. Receipt/policy/gate ancestry and original config/seed/smoke hashes were reverified before the single successful signed source commit above. No reset/stash/rebase, duplicate commit or new scope was used. No uncertain stage/commit outcome remains.

The platform slice is implemented and exercised. Whole API type checks, central property/factory wiring, producer migrations and actual production web/native E2E remain integration prerequisites, not claimed gates. No source-only/schema test is called full M1 acceptance. No paid/live provider/model call, secret read, account/key/resource creation, deployment, push/main/integration promotion, software/device/EAS/store action occurred. No central config/manifest/lock/schema/entrypoint/gate/policy/receipt or other-owner source changed.

Source C is followed by this report-only direct child R. Deliver exact R out of band for Lead verification/merge; this report does not reference its own future hash.
