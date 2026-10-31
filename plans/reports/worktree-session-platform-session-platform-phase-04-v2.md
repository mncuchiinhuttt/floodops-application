# SessionPlatform SourceEvidence — image event isolation correction

Status: correction source-ready for IntegrationLead review/merge. No platform-ready or backend-ready gate is published by this worker.

## Identity, baseline and ownership

- Work item: `session-platform-phase-04-v2`; role `session-platform`; branch `feat/floodops-session-platform`.
- Worktree/CWD: `/Users/vominhlong/seahackathon-worktrees/04-session-platform`.
- Previous signed delivery: `43a0553fd98ff79e1b22d61447c80534a71e0fef`, verified clean and a valid ancestor before resuming.
- Base: `3f796bc0cb78d5d942f923945e73bb9738994134`.
- Observed approved launch: `f5a624dcf5106583eb6fa49d7105aaa476c00583`, merged exactly by fast-forward preserving history. Base→launch contains only the two v2 receipt/packet documents; other inherited integration changes precede the declared base and are not worker edits.
- Receipt: `worktree-execution/launch/session-platform/session-platform-phase-04-v2.json`; amendment `session-platform-image-event-isolation-v1`.
- Policy commit: `aea042b5fdb5100e826672111f326d3a03847ee7`; SHA256 `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`.
- Frozen contract index at `1f2b77e88be0a5ebd1644ad11c3cb5c3bfe5f5ca`; SHA256 `dcfe1d17e95d73295cfa76fa0ac93ec9aaae46df1c7b2c325c79b23a729df82e`. All 306 declared artifact hashes verified; policy/index also matched the launch. Base and all required gates are launch ancestors.
- Exact source_sha=C: `b496dc79d95971ed2a5d737e1c55012c02792b81` (`fix(api): enforce dispatcher-only image event projection`). Existing signing configuration preserved; `git verify-commit` passed.
- Source scope: five files, 127 insertions/5 deletions; every path matches both role ownership and the narrower correction amendment. No rename, symlink escape or TypeScript file reaching 200 lines.

## Verified failure and correction

The v1 write path forced image-event roles to dispatcher but retained explicit participant targets. The generic read filter accepted matching role OR participant ID. A trusted downstream reducer misconfiguration could therefore disclose an image-review event to a field-role participant. This is not a public reducer-registration or direct command-permission bypass claim.

Before the production fix, the new actual Workerd regression reproduced the leak separately for contributor, driver and viewer: each authenticated field participant received one `image_review_changed` event when explicitly targeted; expected zero. The three privacy assertions failed after successful command/GET setup.

`apps/api/src/session-runtime/events.ts` now enforces both boundaries:

1. Append normalization persists image events with `roles:[dispatcher]` and an empty participant audience, regardless of supplied role/participant targets.
2. Shared read projection inspects event type before ordinary audience logic. Image events are visible only to the authenticated dispatcher role, independent of stored audience and event actor. This also protects already-persisted misdirected rows without requiring a data migration.

Other events retain their existing role OR participant visibility. `next_sequence` and `has_more` still derive from scanned rows, so hidden events advance the cursor. JSON catch-up, SSE initial delivery and SSE polling all call the same projection. No wire schema/permission, operational revision, model/reward behavior or event payload fields were added.

Other source files:

- `apps/api/src/session-runtime/README.md`: documents normalization and read-time policy precedence, including legacy rows.
- `apps/api/test/runtime-worker.ts`: test-only, authenticated metadata reducer emits a deliberately misdirected image event with safe report/job IDs; it is not a production route/registry change.
- `apps/api/test/replay/image-event-fixtures.ts`: real DO controlled legacy-row fixture and HTTP/stream readers.
- `apps/api/test/replay/image-event-isolation.test.ts`: 29 behavior regressions covering all three field roles, owner/invited dispatchers, six event-actor values, actual v1 participant-targeted rows, incorrect role audiences, ordinary targeted events, cursor pages, JSON/SSE initial parity and active SSE polling.

## Actual checks and smoke

All commands ran in the worktree CWD above, on the source state committed as C. No full-repository build/lint/watch was run.

| Command/check | Result |
|---|---|
| `bun install --frozen-lockfile --ignore-scripts` | PASS; refreshed local dependencies for approved baseline only; manifests/lock unchanged by worker. |
| `bun run --cwd apps/api test:runtime test/replay/image-event-isolation.test.ts -t "new image event"` before fix | Expected FAIL: 3 role privacy assertions, received 1 event instead of 0; 26 cases not selected. |
| `bun run --cwd apps/api test:runtime test/replay/image-event-isolation.test.ts` after fix | PASS, 29/29 actual Workerd cases. |
| `bun run --cwd apps/api test:runtime` | PASS, 73 tests / 9 files: prior 44 plus 29 regressions, including final Reset changes. |
| `bun run --cwd apps/api typecheck` | PASS. |
| `bun --bun run tsc --noEmit -p apps/api/test/capabilities/tsconfig.json` | PASS, source and runtime tests. |
| `bun --bun run eslint apps/api/src/session-runtime/events.ts apps/api/test/runtime-worker.ts apps/api/test/replay --max-warnings=0` | PASS. |
| `git diff --cached --check` before source commit | PASS. |
| Correction ownership/real-path/line-length checks | PASS; only the five authorized source files. |
| `git verify-commit C` | PASS. |

Separate actual HTTP smoke launched the owned Workerd process on `127.0.0.1:8784` using unchanged `wrangler.test.jsonc`, `--local`, isolated `.wrangler/state/session-platform-image-isolation-smoke`, remote bindings and telemetry disabled. It created/claimed a synthetic contributor capability, emitted a deliberately misdirected metadata event through the test-only reducer, and observed:

- Dispatcher JSON received one image-review event with safe IDs.
- Explicitly targeted contributor JSON received `events=[]`, `next_sequence=1`.
- Contributor SSE received only a cursor frame at sequence 1, without event type or report/job IDs.
- Operational revision remained 0; event_sequence became 1.

Smoke PASS. Its process was stopped. Synthetic credentials stayed only in process memory and were not printed or saved. Regression tests additionally exercised real SSE polling and cancellation across contributor/driver/viewer roles. These are actual local Hono/Workerd/SQLite paths; no vision provider was called.

Configuration/fixture hashes:

- Unchanged `apps/api/wrangler.test.jsonc`: `0df2661d25dc5b5fd61c7e3d109c8d5829bcf8731409ccfcfdb0c64daa7eaafe`.
- Unchanged `apps/api/vitest.config.ts`: `e5a46f60f6e19afac378809957a3a17b8e9d04eea35a68e29be8c4630b58e70d`.
- Updated synthetic harness/registry `apps/api/test/runtime-worker.ts`: `4d0494d240341a225b2a22c3c1259cfde7fdcb91c817917b2e2ee47d444025df`.
- Regression matrix `apps/api/test/replay/image-event-isolation.test.ts`: `02292f7e8767beff5bbb698eea25b9033554c36224a57a79307e5bc003470f10`.
- Approved baseline `bun.lock`, unchanged by worker: `d953b2eb0cd45c393b12c93a5328727e335e821225df85a5de1f001fad6a0cef`.

## Integration and remaining limits

No dependency, central config, binding, public export or wire-contract change is requested. Lead can verify/merge the exact report delivery, rerun its integrated privacy probe and decide the platform gate. Actual production entrypoint/registered class/scenario/feature-port composition remains Lead/owner work from the v1 handoff. Missing business projections must remain explicit dependency failures; the synthetic test seed is not production data.

Read-only code and documentation reviews found no remaining correction issue. Full application/native device, D04 calibration, provider quality/billing/retention, deployment and release acceptance are not claimed. Existing launch dependency-audit qualifications remain; this correction did not change/re-audit the dependency baseline.

No central/protected/other-owner writes, policy/receipt/gate edits, unrequested remote push, integration/main merge, deploy, account/key/resource creation, paid provider or real-device action occurred. No denied, pending or uncertain action remains for this correction. Runtime settings were not changed; unavailable self-introspection remains unverified.
