# SessionPlatform SourceEvidence — terminal Reset stream correction

Status: assigned v4 correction source-ready for IntegrationLead review/merge. No full backend/client/model/device gate is claimed or self-published.

## Verified work item and baseline

- Work item `session-platform-reset-stream-v4`; role `session-platform`; branch `feat/floodops-session-platform`.
- Worktree/CWD `/Users/vominhlong/seahackathon-worktrees/04-session-platform`.
- Previous signed clean delivery `9169bd13c1e2da45010b1daa255d36f36b575092` preserved.
- Base `223a58654210e934dfb1eda1092be33a7fdc30fe`; exact launch `2364a58e271a738790fe2a70fd47f67ad0befb52` merged by fast-forward, preserving history. Base→launch contains only the15 approved worker launch/packet documents; earlier integrated producer/central changes precede the declared base.
- Receipt `worktree-execution/launch/session-platform/session-platform-reset-stream-v4.json`; narrow amendment `backend-repairs-client-runtime-v1`.
- Policy commit `aea042b5fdb5100e826672111f326d3a03847ee7`, SHA256 `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`.
- Contract index `worktree-execution/contracts/backend-client-runtime-v1-index.json` at `223a58654210e934dfb1eda1092be33a7fdc30fe`, SHA256 `bda263b1d21bfa26994d857da94f97b8974a3cfee08059e805e889f765202527`; declared source `91158e2dd79ebcdd8761d884784553afd4fc46c4`. All654 raw-byte artifacts verified at source, index and launch. Policy/index and contracts/simulation/workspace/plan/platform gate ancestry passed.
- Exact source_sha=C: `695e850849b649d87570858f0944bdbd06772d00` (`fix(api): deliver reset notices before closing session streams`). Existing identity/signing preserved; `git verify-commit` passed.
- Eleven owned source/test/doc paths,241 insertions/10 deletions, no rename/symlink escape; every TypeScript file below200 lines. All paths match the role plus narrower amendment. No central config/manifest/lock/schema/export/gate mutation.

## Confirmed failure and bounded correction

The suspected ordering defect was reproduced before implementation changes with real open Workerd SSE requests: dispatcher, driver, contributor and viewer each successfully opened a stream, the dispatcher successfully Reset, and the subscriber read to EOF with zero `session_reset` events. All four expected-terminal assertions failed after valid setup.

`readCall` previously authenticated against reset-session status before projecting events; the SSE poll closed on that410 before reading the already persisted reset event. The correction adds one explicitly bounded exception, not general old-session access:

- `session-runtime/terminal-stream.ts` permits only `stream-poll` for a reset session with an existing unexpired registration owned by the same participant and a still-valid, nonrevoked capability. Transport, exact Origin, capability/session wall expiry, `session:read` and cursor/limit validation remain enforced.
- It returns only the canonical stored `session_reset` matching the old session/generation/current replacement ID, consumes that registration, and never calls touch(), mints credentials, returns old private backlog or exposes replacement participant IDs.
- `session-runtime/reads.ts` routes only that terminal poll to the helper. Normal old-session JSON/views and new SSE handshakes still return410; old capabilities cannot authorize the replacement session.
- `features/session/stream.ts` emits the existing canonical cursor control frame before a reset event if terminal delivery skips backlog, writes the persisted event, then closes. The stream body, header/CORS behavior and ordinary event projections remain intact. A bounded terminal notice is delivered even when the normal backpressure threshold was reached.
- `session-runtime/lifecycle.ts` defers reset compaction while live pre-existing stream registrations remain. `session-object.ts` schedules housekeeping through their original bounded deadlines, preserves pending-cleanup retry backoff, then compacts on a subsequent housekeeping turn. It does not extend stream/capability TTL or keep an immortal subscription.
- `session-runtime/README.md` documents the narrow terminal path and cleanup ordering.

Four owned replay test files add15 regressions: actual open→Reset→EOF for all four roles; forced cleanup alarm before terminal delivery; persisted-event identity; skipped hidden cursor ordering; no TTL refresh; one-use slot consumption; wrong owner/missing or expired slot; revoked/expired/no-permission credentials; wrong transport/Origin; absolute wall expiry; real revoked/expired stream closure without Reset disclosure; rotated-cookie lost-body Reset recovery; bounded local R2 batch leaving an intent and retaining cleanup backoff. The test-only capability tsconfig adds the already installed Bun types for newly integrated Bun tests while retaining strictness and all includes; API source types remain separately checked.

## Actual validation

All commands below ran in the worktree CWD above on the source state committed as C. No full-repository build/lint/watch was run.

| Command/check | Result |
|---|---|
| `bun install --frozen-lockfile --ignore-scripts` | PASS;67 local packages refreshed for the approved baseline, no scripts/copying or manifest/lock changes. |
| `bun run --cwd apps/api test:runtime test/replay/reset-stream.test.ts` before fix | Expected FAIL,4/4 privacy-safe terminal assertions: zero Reset events before EOF instead of one. |
| `bun run --cwd apps/api test:runtime test/replay/reset-stream.test.ts test/replay/reset-stream-guards.test.ts` after fix | PASS,15/15. |
| `bun run --cwd apps/api test:runtime` after final alarm-order change | PASS,101 tests across12 files; all86 existing cases retained plus15 new cases. |
| `bun --bun run vitest run --config tooling/runtime/vitest.config.ts` | PASS,5 retained real central composition tests, repeated after final alarm-order change. |
| `bun run --cwd apps/api typecheck` | PASS. |
| `bun --bun run tsc --noEmit -p apps/api/test/capabilities/tsconfig.json` | PASS; initial newly integrated Bun-test type failures were resolved by the existing Bun type entry, without excluding files or relaxing checks. |
| Scoped ESLint on session runtime/features and capability/replay tests, `--max-warnings=0` | PASS. |
| `git diff --cached --check` before C | PASS. |
| Amendment ownership/real-path/line-length checks | PASS,11 source paths. |
| `git verify-commit C` | PASS. |

Separate actual public runtime smoke started the owned central Wrangler/Workerd process on `127.0.0.1:8784`, using unchanged `tooling/runtime/wrangler.jsonc`, `--local`, isolated `.wrangler/state/session-platform-reset-stream-v4-smoke`, remote bindings and telemetry disabled. The unchanged central entrypoint/registered SessionDO loaded the integrated immutable synthetic functional bundle.

The API package does not link the API-client workspace dependency. No package change or private deep import was used: a Bun client ran from `apps/web`, whose existing declared `@floodops/api-client` dependency provides the public `parseSse` and `EventCursor`. It opened a real contributor stream, generated two dispatcher-only membership events, Reset, parsed through EOF and observed exactly one canonical Reset with the correct replacement session ID and contiguous final cursor3. No EventSequenceGap/catch-up was needed for terminal delivery. Terminal payload had no participant IDs or owner/member/replacement credentials. Old JSON catch-up and new old-session stream handshake both remained410. Smoke PASS; its server was stopped and synthetic credentials stayed only in process memory.

Configuration/fixture hashes:

- Unchanged `apps/api/wrangler.test.jsonc`: `0df2661d25dc5b5fd61c7e3d109c8d5829bcf8731409ccfcfdb0c64daa7eaafe`.
- Unchanged `tooling/runtime/wrangler.jsonc`: `9624b0ded33f43c747df0161b45bb92a523b49863a89595722fd955f253c4324`.
- Reset stream role matrix: `40b6d24451daf8e3dcb17e170d08ed188d9a2e9f74af44ed662005c747a33e7f`.
- Terminal guard/alarm matrix: `7f4b8d9491c4c03e7f37a1507619991dc25d26213db6dee78c46d1d40614f08b`.
- HTTP/SSE fixture: `5f57b9401c4119e8a10c6d917c617d1df2b22dfe536e932eda654f64c32542f9`.
- Controlled storage fixture: `b3281e66f660d80c94699343aa1072dfbd53b8232542e6c8baa7ce6446ae65e5`.
- Approved baseline `bun.lock`, unchanged by worker: `51e78190af81387909c19c65adfce6da02b8567778f70a26f78dcce98ee5c1ab`.

## Handoff, observation and limitations

No dependency, central registration/config or wire change is required for this correction. Read-only code/test/docs review found no remaining blocker in the assigned Reset slice. Lead should verify/merge exact delivery and decide its independent gate/cutover.

One pre-existing ordinary-stream observation is intentionally outside this narrow work item: a normal filtered page can place a visible event after a hidden sequence before its trailing cursor; direct EventCursor then signals a gap and existing watchEvents uses authorized JSON catch-up while the session is active. This behavior was not broadened or changed here. The Reset-specific path now advances the cursor before its terminal event because old-session catch-up is forbidden after Reset. If Lead wants to remove ordinary catch-up overhead, assign a separate cursor-before-every-visible-gap correction with mixed-page consumer tests.

Full Sources/Planner/Review/Results/backend/client completion, UI E2E, native devices, live models/account budgets/Images and D04 calibration are not claimed. Existing dependency-advisory release qualifications persist. No provider call, paid service, deployment, account/key/resource creation, EAS/store/device action, push or main/integration promotion occurred. No policy/receipt/schema/gate/other-owner source or real Git signing/config changes occurred. No denied, pending or uncertain action remains within the assigned correction; runtime settings were not changed.
