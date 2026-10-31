# SessionPlatform SourceEvidence — phase 04

Status: source-ready for IntegrationLead composition and gate acceptance. This report does not publish platform-ready/backend-ready or claim full application, native-device, vision-model, calibration or release acceptance.

## Identity and baseline

- Work item: `session-platform-phase-04-v1`; role: `session-platform`; phase: 04.
- Worktree/CWD: `/Users/vominhlong/seahackathon-worktrees/04-session-platform`.
- Branch: `feat/floodops-session-platform`.
- Base: `f0c6dc019dc63df89eb8c479de2cd00310123f54`.
- Observed launch: `c17ef2531904f2d94b39e074677cdd212db7d0cc`; checkout was already exactly this SHA and clean, so no merge was needed.
- Policy commit: `aea042b5fdb5100e826672111f326d3a03847ee7`; SHA256 `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`.
- Contract index: `worktree-execution/contracts/contracts-ready-v1-index.json` at `1f2b77e88be0a5ebd1644ad11c3cb5c3bfe5f5ca`; SHA256 `dcfe1d17e95d73295cfa76fa0ac93ec9aaae46df1c7b2c325c79b23a729df82e`.
- All 306 index artifact hashes verified at the declared commit. Base, contracts-ready, workspace-bootstrap and plan-published commits were verified ancestors. Base→launch contains only the seven approved launch/packet documents.
- Exact source_sha=C: `0b6521ab2b717ad5f41d36ae785cb7a13e7e6be4` (`feat(api): implement durable session runtime and capability security`). Existing signing configuration was preserved; `git verify-commit` passed.
- Requested runtime settings were left unchanged; model/effort/service-tier are not introspectable from this worker.

## Owned delivery

43 new files, 1747 lines, all uniquely matched to SessionPlatform ownership; no renames. Every TypeScript file remains below 200 lines.

- `apps/api/src/app/**`: Hono factory, typed injected feature routers, bounded JSON parsing, strict wire responses, JSON API errors/404, request IDs, exact Origin/CORS, cookie/native transport and security headers.
- `apps/api/src/session-runtime/**`: SQLite schema-version initialization, transactions, capabilities/digests/sealed credential outcomes, membership, CAS/idempotency, actor projections, pagination, event replay, generic current pointers/job leases, image-review metadata, reset saga, expiry/private-media cleanup. Public seam documentation is `apps/api/src/session-runtime/README.md`.
- `apps/api/src/features/session/**`: create/claim/identity/session metadata/invite/participants/revoke/logout/delete/reset, role view adapters, JSON catch-up and bounded SSE.
- `apps/api/src/shared/**`: public platform types, errors, crypto and typed runtime/image metadata client.
- `apps/api/test/{capabilities,commands,replay,reset,expiry}/**`, `apps/api/test/runtime-worker.ts`, `apps/api/vitest.config.ts`, `apps/api/wrangler.test.jsonc`: actual Workerd/SQLite/R2 harness, strict test types and 44 behavior cases.

Capability tokens are independent random 256-bit values; SQLite auth records contain digests. Credential-bearing outcomes are AES-GCM sealed with key ID and session/participant/key/request AAD. Create locators use environment-scoped HMAC of the opaque client nonce/key; per-IP/hour limits use durable counters and hashed locators. Web capabilities require HttpOnly Secure SameSite cookie and paired CSRF+Origin for mutation; native capabilities require bearer transport. Claim role/entity/permissions come from the server-frozen one-use invitation. Invited dispatchers do not gain owner delegation, including through Reset.

Atomic commands check authenticated participant/key replay before CAS, preserve original committed outcomes, and commit snapshot/events/outcome/pointers/leases/outbox together. Reducer and watchdog callbacks run synchronously inside the DO; network, R2 and provider I/O are outside transactions. Latest-requested-job changes clear the latest-plan pointer. Expected-pointer and lease fences reject same-revision supersession, old generation/revision and obsolete current jobs. Advance watchdogs only release their own current lock and do not advance simulation time.

Reset persists its old-session lock, fixed replacement, sealed credentials and replay binding before cross-DO initialization. Allocated/initialized/tombstoned stages are monotonic across concurrent retries. Narrow recovery accepts only the recorded original or replacement capability with the same reset key/digest and valid Origin; for web, either recorded old or new CSRF digest is accepted. The lost-body case was exercised with only a rotated cookie and the original CSRF, without reading the original response body. Replacement credentials do not authorize any other old-session endpoint.

Image metadata reserves one current job per report/input, persists lease/deadline/quota, reuses current active/completed jobs, counts starts once and never retries a provider automatically. Registered authoritative binding checks run before start and publication. Human decision, changed input, Reset and expiry supersede advice; unrelated revision/advancing state does not. Completed valid advice survives its provider deadline. Missing/failed results remain null. Events contain safe IDs and are dispatcher-only; image metadata never changes operational revision, human decision, knowledge, rewards, routes or ETA. No advisory/provider service is implemented here.

SSE and JSON replay share audience/scan-cursor semantics; hidden pages advance cursors. Streams have durable five-slot quota, 60-second lifetime, 15-second heartbeat and repeated authorization; cancellation/revoke/expiry/reset releases or bounds slots. Expiry checks run on access independently of alarms. Cleanup uses only session-owned `sessions/<session_id>/...` REPORT_MEDIA keys, bounded batches and a persistent retry outbox. It never deletes shared scenario assets. Closed-session domain/media state is compacted only after cleanup; minimal replay/tombstone data remains through original absolute expiry.

## Actual validation

All commands ran in the worktree CWD above. No full-repository build/lint/watch was run.

| Check | Result/evidence |
|---|---|
| `bun install --frozen-lockfile --ignore-scripts` | PASS; Bun 1.4.0, 866 packages; central manifest/lock unchanged. |
| `bun run --cwd apps/api test:runtime` | PASS, 44 tests / 8 files in actual Workerd, SQLite DO and local R2. Synthetic scenario and deterministic reducers/model advice are explicitly test-only. |
| `bun run --cwd apps/api test:runtime test/reset/saga.test.ts` | PASS, 6 tests after the final tombstone locator adjustment; full suite above preceded this small final adjustment. |
| `bun run --cwd apps/api typecheck` | PASS at source C. |
| `bun --bun run tsc --noEmit -p apps/api/test/capabilities/tsconfig.json` | PASS at source C; includes source and focused runtime tests. |
| Scoped ESLint over the delivered app/shared/runtime/session/test paths plus Vitest config, `--max-warnings=0` | PASS. |
| `git diff --cached --check` before source commit | PASS. |
| Ownership/symlink/line-length check | PASS, 43 source files uniquely owned, no escape/protected paths. |
| `git verify-commit C` | PASS with existing signing configuration. |

Actual scenarios include native/web create→identity→invite→claim; cross-session and role isolation; CSRF/Origin/transport denial; concurrent CAS yielding exactly one commit; key/body conflicts; metadata-only revisions; partial SQL rollback after an event insert; exact replay after actual DO eviction; cookie-body-loss reset recovery; concurrent resets yielding one target/tombstone; real replacement initialization interruption before target snapshot creation; staged recovery after eviction; idle/absolute expiry; actual private R2 deletion; explicit deletion-failure stub retaining the outbox followed by actual R2 retry; hidden-event cursors/SSE; stream quota/revocation; image metadata timeout/current-input/late-output/null-result/privacy/budget behavior; generic old/new advance lease fencing and abandoned watchdog recovery.

A separate local HTTP smoke started Workerd on `127.0.0.1:8784` with `wrangler.test.jsonc`, `--local`, isolated `.wrangler/state/session-platform-smoke`, remote bindings disabled and telemetry disabled. It created a synthetic session, committed counter=4/revision=1, stopped its own Workerd process, started a new process using the same local persistence, then observed revision=1 and the exact original idempotent response, one committed event, stale CAS=412, Reset generation=1 and old capability=410. Both owned smoke processes were stopped. Synthetic credentials remained only in process memory and were never printed or written to evidence.

Configuration hashes:

- `apps/api/wrangler.test.jsonc`: `0df2661d25dc5b5fd61c7e3d109c8d5829bcf8731409ccfcfdb0c64daa7eaafe`.
- Synthetic harness/seed/registry `apps/api/test/runtime-worker.ts`: `b418299cf0219771f48413b0aae9994128b7dee649c0530c066df06d3b592b06`.
- `apps/api/vitest.config.ts`: `e5a46f60f6e19afac378809957a3a17b8e9d04eea35a68e29be8c4630b58e70d`.
- Unchanged `bun.lock`: `8fd61bf2172c41a859459209f9e2b1ae3d5221d5100d4248688d915d8d50fc8d`.

## Public interfaces and exact integration requests

1. **IntegrationLead:** compose `createApp(featureRouters, ports)` from `apps/api/src/app/index.ts` and a registered DO class from `createSessionObject(registry)` in `apps/api/src/session-runtime/index.ts`. Keep production `apps/api/src/index.ts`, Wrangler bindings/config and public aggregates as separate Lead commits. Required bindings are SESSIONS, WEB_ORIGIN, APP_ENV, SESSION_LOCATOR_KEY, CAPABILITY_SEAL_KEY_ACTIVE and CAPABILITY_SEAL_KEY_ID; optional previous CAPABILITY_SEAL_KEYS keyring and REPORT_MEDIA cleanup binding. Keep previous seal keys through replay/rollback windows. No new dependency is requested.
2. **SimulationData/Lead:** inject the frozen `PlatformPorts.loadScenario` seed, real initial values, horizon/calibration status and driver/contributor entity IDs. The test-only synthetic scenario is not a production scenario implementation.
3. **Feature owners/Lead:** register real snapshot/overview/own-driver/own-contributor projections and strict domain command reducers inside the DO. Missing projections return CONFIG_INCOMPLETE; prohibited role projections return FORBIDDEN. No fabricated successful empty dashboard/snapshot was supplied.
4. **PlannerSafety/ResultsEvaluation:** use transition current pointers and Call.expectedPointers for approval/dry-run/Execute, and lease fences for continuation. Register synchronous onLeaseExpired metadata recovery. Actual planning/advance DTO/domain transitions remain their owner scope.
5. **SourcesMedia:** use Transition.mediaKeys for ownership registration and Transition.cleanupKeys for orphan deletion intents, under the enforced session key namespace. Supply authoritative normalized-media/report binding data through the approved seam; normalization/media routes remain SourcesMedia-owned.
6. **ReviewRewards:** use `createSessionRuntimeClient` / `ImageReviewMetadataPort` from `apps/api/src/shared/index.ts`; reserve→start immediately before provider effect→complete. Supply RuntimeRegistry.imageBinding from authoritative pending-report/media/model/rubric context. The returned internal effect/lease is never exposed by HTTP send(). ReviewRewards owns the advisory route/service/provider, deterministic rubric derivation and human review logic.

## Limits and remote actions

- Production/backend composition and actual business feature projections are pending the Lead/owner integrations above; this worker does not self-publish a gate or edit plan status.
- Full cross-client application E2E, native iOS/Android streaming/device checks, real provider/model quality and billing/retention checks, Images entitlement, D04 provenance/calibration, deployment and rollback drills are unavailable/not run here. Test advice is deterministic fixture data, not vision-quality evidence.
- Resource defaults follow the frozen operational-limit proposals and are documented in the public seam; release environment configuration/approval remains separate. Client entropy cannot be measured by the server; the runtime requires bounded opaque base64url/UUID-style keys and the contract-minimum 32-character client scope.
- The launch packet's known Expo CLI Zod 3.25.76/deepmerge audit qualifications are inherited; this worker did not re-audit or alter the frozen dependency baseline. This delivery is not security/release clearance.
- No central/protected/other-owner files, policy, receipt, gate, Git identity/config or signing settings changed. No user changes were overwritten, and no credentials/node_modules were copied from siblings.
- No push, main/integration merge, deploy, account/resource/key creation, paid provider call, real-device action or production mutation occurred. There were no denied or uncertain actions remaining.
