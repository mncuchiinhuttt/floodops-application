# SessionPlatform SourceEvidence — independent metadata CAS and queued image failure

Status: assigned v5 source-ready for IntegrationLead verification and exact merge. This report does not publish platform/M1/full application gates.

## Baseline and authority verification

- Role/work item: `session-platform` / `session-platform-review-hooks-v5`.
- CWD: `/Users/vominhlong/seahackathon-worktrees/04-session-platform`; branch: `feat/floodops-session-platform`.
- Base: `afb8f9c167ce48d8886644af5a8b29899ee1446b`; exact authorized launch: `b686741d5b5273526f5eb5657a290c4df6fde746`. Fast-forward merge preserved prior signed delivery/history, without reset, stash or rebase. Base→launch contains only the12 approved launch/packet/checkpoint documents.
- Receipt: `worktree-execution/launch/session-platform/session-platform-review-hooks-v5.json`; amendment: `m1-deterministic-cutover-v1`; prompt: `launch/fast-packets/session-platform-review-hooks-v5.md`.
- Policy commit/hash: `aea042b5fdb5100e826672111f326d3a03847ee7` / `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`.
- Index: `worktree-execution/contracts/m1-cutover-inputs-v1-index.json` at declared base; SHA256 `e7065b1e2a71db2d58a0dc4f5acf06c77026da1dee990c2678785589909b6777`. Source `34fa8539c2ef61b6df6c0798d9792e7d8cd74f7a`; source PRD `9036f6332f810eda5366dd63a60d4bb615f38374`. All721 pinned raw artifacts verified at source/index/launch; all required gate ancestors and policy/index hashes passed, including a separate read-only handoff audit.
- This input declares `contracts_ready:false`, legacy contracts ready and M1 refreeze pending. These independent hooks preserve the valid legacy wire; no new endpoint/schema or runtime AI Commander/tool interface was added.
- Signed source C: `33559e8a921d390acf08b2eea0154df2a49ee433` (`fix(platform): add atomic metadata review hooks`). `git verify-commit C` passed under the unchanged identity/signing configuration.
- Source delta:14 owned files,332 insertions/7 deletions. All match both role ownership and narrowed amendment prefixes; no central/protected/other-owner files changed, no symlink escapes, all changed code below200 lines. Own report is the separately authorized exact evidence path.

## Delivered behavior and public integration seam

`ReducerDefinition.requireCas?: boolean` is exported through the existing public shared/session-runtime modules. The real synchronous SQLite transaction requires If-Match when `operational || requireCas`, after exact idempotency replay and before reduce. Only `operational:true` increments revision. Operational CAS cannot be disabled by `requireCas:false`. Metadata events, state and replay outcome still commit atomically. Capability/Origin/CSRF/Reset checks remain ahead of replay disclosure.

`createSessionRuntimeClient(env).imageReview.failQueued(context, reportId, jobId, lease, error_code): Promise<Reply>` is included in public `ImageReviewMetadataPort` and matches Review's `QueuedImageFailurePort`. Its internal command is `image-fail-queued`, with exactly `{job_id,lease,error_code}`; it is binding-only, with no public HTTP route. The parser rejects result/success/unknown/missing fields, invalid IDs/nonces and errors outside the canonical five image failure codes. The supplied lease is extracted before hashing; a random newly generated nonce is never substituted.

Inside the transaction the hook requires an authenticated dispatcher with `reports:review`, valid transport/Origin/CSRF/session capability, matching session/generation/report/current job/input digest/model/config/rubric/nonce, queued status, `started:false`, and unexpired finite lease/deadline. It atomically stores `failed`, `result:null`, the requested failure code and completion time, then appends the canonical dispatcher-only IDs event. It never starts the provider, modifies operational state/revision or writes the provider counter. Reserve stays uncharged; only start charges, with no refund/decrement.

Required consumer wiring is now available without a platform dependency/config request:

- Review's reject reducer can set `operational:false, requireCas:true` while keeping its own pending-state/domain guards.
- Review image service can pass `failQueued: client.imageReview.failQueued` alongside `metadata: client.imageReview`. Consumer business/route wiring remains Review-owned and was not edited here.
- The legacy strict derived-advice shape remains enforced by complete; the pending M1 image DTO cutover is not fabricated here.

`session-runtime/README.md` documents the public hooks and validation. The test-only registry supplies a strict reject-style reducer, not a production Review implementation.

## Actual validation on source C

All checks used the assigned worktree and its own dependencies/local state. No global repository build/lint/watch or remote deployment ran.

| Command / CWD | Result |
|---|---|
| `bun install --frozen-lockfile --ignore-scripts` / worktree root | PASS; checked1102 installs across1261 packages, no changes, no lifecycle scripts or copied dependencies. |
| `bun --bun run vitest run` / `apps/api` | PASS,129 tests across15 files;101 prior cases retained plus28 new cases. |
| `bun --bun run tsc --noEmit -p test/commands/platform-tsconfig.json` / `apps/api` | PASS under the existing strict compiler options for all platform source and owned Workerd tests. This additional config does not alter or replace the full checks. |
| Scoped ESLint on the11 changed TypeScript source/test files, `--max-warnings=0` / worktree root | PASS. |
| `python3 apps/api/test/commands/metadata-cas-smoke.py` / worktree root | PASS, executable local Hono + Workerd + SQLite HTTP smoke on127.0.0.1:8784; own temporary state and process cleanup, credentials only in memory. |
| `bun run --cwd apps/api typecheck` / worktree root | FAIL at the pre-existing other-owner `src/features/reports/review/state.ts:39` TS2367 comparison against `SOURCE_SCOPE_INCOMPATIBLE`; no platform source errors. Review owner must reconcile the stale source-error union. |
| `git diff --check`, real paths/ownership/line checks, signature verification | PASS. |

The new Workerd cases exercise missing428/stale412/current200 metadata CAS, unchanged revision, eviction/replay after a later operational revision, changed-body key conflict, exactly-once reject event, same-revision decisions, concurrent operational/metadata ordering, authorization/Origin/CSRF and old-session denial after actual Reset.

Queued-failure tests use the real serialized public runtime client and SQLite DO, including eviction before callback and after persisted failure. They cover all five failure codes, counter9→reserve/fail9→retry/start10 with no refund; the concurrent start/fail race commits exactly one winner with the corresponding0/1 charge. Strict input failures, unknown session/report/job, wrong nonce, forged non-dispatcher permission row, CSRF/transport, started/running/completed states, generation/input/model/config/current pointer changes, expired lease/deadline, Reset/session expiry/revoked/no-permission actor and manual metadata/operational review independence are tested. An invalid persisted rubric constant is explicitly a schema-corruption422 case, not a valid rubric migration. Failure events remain hidden from driver/contributor/viewer and contain IDs only.

The executable smoke observed428/412/200, unchanged metadata revision0, exact replay after operational revision1, changed-body409, exactly two events and `nosniff`. It invokes the synthetic test registry through the actual HTTP adapter; it does not claim production Review routing or image-provider/model E2E. Earlier harness attempts used an unsupported Bun Wrangler runtime, an incorrect events query and incomplete Reset fixtures; these were corrected to the supported CLI/frozen schemas. Final checks above passed without relaxing existing assertions or validators.

Configuration and seed SHA256 at C:

- `apps/api/vitest.config.ts`: `e5a46f60f6e19afac378809957a3a17b8e9d04eea35a68e29be8c4630b58e70d`.
- `apps/api/wrangler.test.jsonc`: `0df2661d25dc5b5fd61c7e3d109c8d5829bcf8731409ccfcfdb0c64daa7eaafe`.
- `apps/api/test/runtime-worker.ts`: `70967a82db15ecb5559f7ca78fcb96b74592ec91d9925679dae9a2da850aa912`.
- `apps/api/test/commands/platform-tsconfig.json`: `7269a117990041a358054befc7ba9fb843d463d5c2928b77152912d59a76eac2`.
- `apps/api/test/commands/metadata-cas-smoke.py`: `f96516486428c38a5afaeef7a472caefa53659796b98446aa8335c455c4462e6`.

## Remaining integration limits and handoff

Platform v5 has no remaining implementation dependency. Whole API typecheck is still blocked by the exact Review-owned TS2367 above; fixing that comparison/union is a Review request, not permission for this worker to edit it. M1 contract refreeze, consumer reject/image wiring, actual production frontend E2E and final integration gates require their owners' evidence. This is not an M1 application pass.

No paid provider/model call, account/key/resource creation, device/EAS/store run, deployment, push or main/integration promotion occurred. No manifest/lock/root config/API entrypoint/schema/gate/policy/receipt or other-owner business source was edited. No blocking mutation or uncertain remote outcome remains. Source C is followed by this report-only direct child R; R is delivered out of band for Lead's exact verification/merge, with no self-referential report hash.
