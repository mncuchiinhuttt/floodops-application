# SessionPlatform SourceEvidence — HTTP response header correction

Status: source-ready for IntegrationLead review/merge and independent gate acceptance. This worker does not publish platform-ready/backend-ready.

## Identity and verified baseline

- Work item `session-platform-phase-04-v3`; role `session-platform`; branch `feat/floodops-session-platform`.
- Worktree/CWD `/Users/vominhlong/seahackathon-worktrees/04-session-platform`.
- Previous clean signed delivery `21d9dd831dbe19385bb82d4f7489b8ab25cf41a5` was verified and preserved.
- Base `30e058252d4176c76a8b17b40e25786f34b50b4c`; exact approved launch `d14dc05ff0a944639b699eae5b1de4b42c690e67` merged by fast-forward without rewriting history. Base→launch contains only the two v3 receipt/packet documents. Earlier Lead/producer integrations belong to the declared baseline, not worker edits.
- Receipt `worktree-execution/launch/session-platform/session-platform-phase-04-v3.json`; approved narrow amendment `session-platform-response-headers-v1`.
- Policy commit `aea042b5fdb5100e826672111f326d3a03847ee7`, SHA256 `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`.
- Contract index at `1f2b77e88be0a5ebd1644ad11c3cb5c3bfe5f5ca`, SHA256 `dcfe1d17e95d73295cfa76fa0ac93ec9aaae46df1c7b2c325c79b23a729df82e`. All 306 artifact hashes and launch policy/index checked; required gate/base ancestry passed.
- Exact source_sha=C: `220d41c685dae65da079161230109acebfdfa2ac` (`fix(api): preserve security and CORS response headers`). Existing identity/signing configuration preserved; `git verify-commit` passed.
- Six authorized source/test/doc files changed, 161 insertions/5 deletions. No rename or symlink escape; every TypeScript file remains below 200 lines. No central source/config/tooling/manifest/lock/receipt/gate mutation by this correction.

## Reproduction, fix and delivered files

The retained Lead composed-entrypoint Workerd test reproduced the baseline failure unchanged: 4 pass/1 fail, health `X-Content-Type-Options` was null instead of nosniff. The pinned Hono implementation prepares `c.header` values before a response exists; returning a bare `new Response` bypasses those prepared headers.

- `apps/api/src/app/http.ts`: `send()` now constructs the response through `c.newResponse`, merging middleware security/exact-Origin CORS headers with the existing adapter status/body/ETag/request ID/Retry-After/Set-Cookie headers. A local Hono StatusCode type adaptation avoids changing the shared Reply contract. Empty 204 has no JSON body or JSON Content-Type.
- `apps/api/src/features/session/stream.ts`: SSE uses `c.newResponse` with the same ReadableStream and stream-specific headers; polling, visibility and cancellation logic are preserved.
- `apps/api/src/session-runtime/README.md`: documents context response builders and empty-204 behavior. Feature adapters should keep using the shared helper/context builder when returning JSON, streams or binary responses.
- `apps/api/test/capabilities/tsconfig.json`: adds only the explicitly authorized `node` type, matching the integrated entrypoint's supported node:crypto fingerprinting and existing supplied dependency.
- `apps/api/test/capabilities/composed-http-fixtures.ts` and `response-headers.test.ts`: 13 actual Workerd cases through the real `src/index` Hono app/scenario loader, with real SQLite DO storage and HTTP/stream readers. Tests cover security/CORS success/errors, native no-Origin bearer, credentialed web preflight/read, bad Origin, CSRF rejection, web Set-Cookie/empty204 clearing, truthful quota Retry-After, cached request-ID/ETag replay, sanitized unexpected loader failure and web/native SSE. After cancellation they await the execution context and assert the durable stream-slot count is zero.

The new API tests use the existing API test Worker's SessionDO binding; they prove the shared response adapters with the real entrypoint app/loader, not a claim that this binding is the central production registration. The unchanged retained Lead suite and the separate real HTTP smoke below exercise the actual central SessionDO registration. Only one negative case injects a clearly labelled failing scenario loader; it verifies error sanitization, not a fake successful feature response.

Origin authorization is unchanged: exact configured allowed Origin receives explicit allow-origin, credentials, Vary and exposed headers. Rejected origins remain403 with no allow-origin/credentials/exposed headers; CORS does not bypass capability or CSRF. Native no-Origin requests still require bearer auth and receive no Origin grant. No wildcard credential origin was introduced. Wire counts remain66 operations/194 schemas/8 Commander tools; no permission, model/reward or domain revision behavior changed.

## Actual checks

All commands ran in the worktree CWD above against the source state committed as C. No full-repository build/lint/watch was run; the requested Lead test suites were run unchanged.

| Command/check | Result |
|---|---|
| `bun install --frozen-lockfile --ignore-scripts` | PASS; approved baseline install only, no lifecycle scripts or copied node_modules/env. |
| `bun --bun run vitest run --config tooling/runtime/vitest.config.ts` before fix | Expected FAIL: 4 pass/1 fail at retained nosniff assertion. |
| `bun run --cwd apps/api test:runtime` after final test strengthening | PASS: 86 tests across10 files; prior73 plus13 response cases, including privacy/Reset/lease regressions. |
| `bun --bun run vitest run --config tooling/runtime/vitest.config.ts` after fix | PASS: 5/5 retained central composition tests. |
| `bun test tooling` | PASS: 33 tests,66 assertions; Lead's temporary synthetic Git histories remain isolated from the real repository configuration. |
| `bun run --cwd apps/api typecheck` | PASS. |
| `bun --bun run tsc --noEmit -p apps/api/test/capabilities/tsconfig.json` | PASS after final test strengthening. |
| Scoped ESLint on app/runtime/shared/session and capability/replay tests, `--max-warnings=0`; final changed-path/capability rerun | PASS. |
| `git diff --cached --check` before C | PASS. |
| Narrow amendment path/real-path/line-length checks | PASS: six source files only. |
| `git verify-commit C` | PASS with existing signing. |

Separate actual HTTP smoke launched the owned Wrangler/Workerd process on `127.0.0.1:8784` using unchanged `tooling/runtime/wrangler.jsonc` (real `src/index.ts`, central registered SessionDO and integrated immutable functional bundle), `--local`, isolated `.wrangler/state/session-platform-response-header-smoke`, remote bindings and telemetry disabled. It observed PASS for:

- Exact-Origin health security/CORS headers and matching response request ID; credentialed OPTIONS204.
- Bad Origin403 with security headers and no CORS authority; unknown route404 and missing feature projection503 retaining allowed-Origin security/CORS headers.
- Real web create/identity with HttpOnly Secure SameSite cookie and ETag, server-bound viewer invite/claim/revoke, and real SSE delivering the committed capability-revoked frame with security/CORS headers.
- Web logout empty204 without JSON Content-Type, preserving cookie clearing and policy headers.

The process was stopped. All session/claim/cookie credentials stayed only in process memory and were never printed or saved. No provider, media upload, remote account or device was used. Functional calibration remains incomplete.

Configuration/fixture hashes:

- Unchanged `apps/api/wrangler.test.jsonc`: `0df2661d25dc5b5fd61c7e3d109c8d5829bcf8731409ccfcfdb0c64daa7eaafe`.
- Unchanged `tooling/runtime/wrangler.jsonc`: `5ab3cf4b088a82ca056ec2c9c78207178481f57046584076f62c64c82ace745f`.
- Unchanged `tooling/runtime/vitest.config.ts`: `48646e45e38fd5e2329c2e5966248356dc7e25c727f5fafc952e93d01ebfa2c8`.
- New response regression matrix: `6c67fc7fd656ede5b3518eaa5a2e0b50d63fcf022eefa75a77a38eb88436aead`.
- New composed HTTP fixtures: `fa8cd38b899dd8a54e861ee517376295e734e09e46db155933b1a4a6449bd258`.
- Approved baseline `bun.lock`, unchanged by worker: `a4750de2b55eb645843c4edb8f5aec35df1cd414a4325f7b2927876e8134a495`.

## Handoff and limitations

No new dependency, central test/config edit, public export or wire amendment is requested. Read-only code/test/documentation review found no remaining correction blocker. Lead should verify/merge exact delivery, rerun its independent checks and decide the platform gate. Missing business projections remain typed503 until their owners implement them; no fake domain success was added.

Full business/cross-client E2E, native device, D04 calibration, live-model/provider-account, deployment and release acceptance remain outside this correction. Existing ExpoCLI Zod3/deepmerge dependency qualifications persist; no dependency audit waiver, pin change or re-audit is claimed.

No worker policy/receipt/gate/central files or real Git configuration/signing settings changed. No push, integration/main promotion, deployment, account/key/resource creation, paid model call or real-device action occurred. No denied, pending or uncertain action remains in the correction. Requested runtime settings were left unchanged; self-introspection remains unavailable.
