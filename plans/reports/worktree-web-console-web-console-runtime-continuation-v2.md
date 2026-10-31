# WebConsole runtime continuation v2 — SourceEvidence

## Startup / source

- Work item web-console-runtime-continuation-v2, sole WebConsole writer; branch feat/floodops-web-console; CWD `/Users/vominhlong/seahackathon-worktrees/09-web-console`.
- Previous signed delivery `a511ab3e27c2c15958ae5465d5394d799ef3c2ab` was clean and ancestor of new launch. Fast-forward merged exact observed launch `2364a58e271a738790fe2a70fd47f67ad0befb52`, preserving prior source/report history. Base `223a58654210e934dfb1eda1092be33a7fdc30fe`; base→launch is15 coordination metadata files.
- Receipt and amendment backend-repairs-client-runtime-v1 authorize owned apps/web source minus global protected files and this exact report. Central manifests/lock/config/contracts/UI/policy/gates remain untouched.
- Policy aea042b5fdb5100e826672111f326d3a03847ee7 / SHA256 b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a verified.
- Contract index backend-client-runtime-v1-index.json at base, SHA256 bda263b1d21bfa26994d857da94f97b8974a3cfee08059e805e889f765202527. All654 artifacts were byte-verified at source91158e2dd79ebcdd8761d884784553afd4fc46c4, index/base and launch. Clean exact fast-forward checkout matched that baseline before implementation.
- Required gate ancestors verified: contracts-ready1f2b77e88be0a5ebd1644ad11c3cb5c3bfe5f5ca; simulation-ready30e058252d4176c76a8b17b40e25786f34b50b4c; workspace-bootstrap aea042b5fdb5100e826672111f326d3a03847ee7; plan-published dee4dfb00af173eb3cccc2a0df75e67fa1577734; platform-ready3cebe9e8d8b4fd4fd11cd319b1549952c119caa5; ui-libraries-ready223a58654210e934dfb1eda1092be33a7fdc30fe. These are published predecessor evidence, not new full business gates issued here.
- Bun1.4.0 frozen install --ignore-scripts passed,67 newly installed packages against the existing isolated worktree dependencies. No copied env/credentials/node_modules/state, no new registry version or lifecycle execution. Requested sol/ultra/fast; actual runtime model/tier fields remain unverified because not exposed.
- Signed final source **C `c0f5b30ae4147233a3d6a39173720b053b8a9c91`**:37 files,902 insertions/51 deletions. Signature verification passed with existing SSH signing configuration. All staged paths passed canonical ownership, amendment scope, realpath, regular-file and code<200-line checks. Report is committed separately after C; enclosing report SHA is sent out of band.

## Implemented runtime

- Real index.html, Vite React/Tailwind app, per-instance React Router Data Mode bootstrap, create/claim/rejoin actions, capability route loaders and lazy workspace chunks. The missing real build entrypoint is fixed. No alternate router, fixture fallback, provider secret or fake credential store.
- Shared ApiClient uses credentials:include, server cookie/CSRF/Origin and strict frozen66API schemas. Identity and invitation secrets remain ephemeral component/runtime memory, outside read query caches and URLs. No Web Storage credential write, persisted mutation or offline operational outbox exists.
- Typed create/claim/invite/revoke/logout/Reset/delete adapters and session/participant UI. Explicit admission transport retry retains the same original body/key/request scope; definitive API failures discard that admission retry. Driver/contributor pages use own endpoints; dispatcher resources use separately permitted APIs.
- TanStack cache is scoped to session/generation/principal; role/entity/permission changes abort old scopes and clear caches. Query functions fence the captured authority epoch/scope before starting so an old key cannot send with a new principal's credential.
- Post-command identity refresh does not reuse a request begun before the command. Queued and in-flight reads are fenced/cancelled on clear/Reset/dispose. Own lifecycle commands pause registered streams and abort identity reads before sending, so a late old-session410 cannot discard the Reset replacement. Focus/background/connectivity handling performs reads only; no automatic operational replay.
- Foreground shared watchEvents uses actual identity metadata, bounded reconnect and role-authorized refresh; sequence invalidation handles unchanged revision. Terminal events clear private state. Actual backend terminal-event projection is a separate SessionPlatform gate; this worker does not claim its Reset-stream fix is complete.
- Plan callbacks remain separate and latest-plan/job/snapshot revision must be verified. In-flight or failed latest-snapshot refresh keeps controls disabled even when TanStack retains old cached data. No optimistic assignment/ETA/points.
- Review splits Accept/Reject/AI gates. AI requires citizen/photo/pending_review/confirmed normalized image readiness; needs_clarification cannot request AI or Accept. Reject does not validate or mutate mapping fields. Driver quick condition remains immutable. Current observable report context binds advice; input changes hide stale results and reset confirmations. In-flight refresh hides the score and blocks decisions while retaining form fields. Normalized image reads use authorized server-owned media/fixture IDs and revocable object URLs.
- Full UI patterns are consumed from the pinned public DesignSystem API; shared packages and schemas were not edited. Simulation/calibration persist; absent provenance remains explicitly unknown.

## Actual verification

**37/37 tests across7files passed**, with app strict typecheck, test strict typecheck and scoped ESLint --max-warnings=0. Tests use actual Router/Query/ApiClient libraries and disclosed synthetic transports; they cover authority deep links,503 UI, principal/cache replacement, cancellation, body-loss keys, forced-refresh ordering, queued refresh across Reset/clear/dispose, late410 during Reset, old query/new credential separation, cached latest-pointer refetch failure, AI/manual status/input fences and masked invitation response state. The invitation unit test creates no real access grant.

An earlier parallel cold-import router test exceeded the default1s DOM wait while still showing the loading skeleton; isolated and final full-suite checks passed. Router tests now wait a bounded10s for their async loader outcome with the same authorization assertions. Earlier test fixture typing and delayed-response test setup were corrected; no business/security assertion or contract was waived.

Final real build at exact source content passed **657modules**, with lazy chunks: largest index267.88kB (82.99gzip), separate shared chunk239.49kB, CSS21.37kB. Fixture build passed519modules with nonfatal third-party Radix module-level use-client directive warnings. Initial monolithic chunk warning was resolved by actual Data Mode lazy imports, not a warning-limit override.

Commands and statuses are in structured evidence below. Builds/test transports are not backend/model/device E2E proof.

## Actual local browser / API smoke

Started isolated actual Workerd API8789 with the supplied tooling/runtime/wrangler.client-demo.jsonc and own ignored state apps/web/.wrangler/client-demo, plus real Vite5174 proxy. All binds127.0.0.1; no LAN/remote/tunnel. The local test config keys are explicitly public synthetic values. No CF-Connecting-IP or auth header was forged; local Wrangler accepted creation with its real local request context.

The actual in-app browser created scenario scn_functional1/version1: POST sessions201, subsequent identity200; the Secure/HttpOnly cookie was accepted on HTTP loopback. No cookie guard was relaxed or bearer fallback introduced. Actual participants/events/stream requests returned200. UI explicitly displayed snapshot503 CONFIG_INCOMPLETE and plans404 NOT_FOUND instead of fixture numbers.

Reset201 moved the browser from generation0 session_4aaa22e35bf806a9f6f611743295e11fc4bf650b96228751f740c36a00c8c337 to generation1 session_dbf692e7b62d456fbc8f30556e441416. Reload recovered identity200 from the server cookie without app token storage. At320px the live session UI had scrollWidth320. Screenshots were emitted in the task browser output; no durable screenshot file was persisted. The browser tab was closed, viewport reset and both own local processes stopped. Synthetic state remains ignored and uncommitted.

### Denied action and pending approval

The attempted **real invitation creation** targeted a300-second driver capability bound to drv_moto01 in local synthetic session_dbf692e7b62d456fbc8f30556e441416, for a self-controlled test client. Automatic approval review rejected it because implementing E2E did not explicitly identify the capability recipient/access scope. Outcome is **denied, known not executed**: a later read confirmed no invitation-code field, and API logs contain no invitation POST. Claim was never attempted. There was no workaround/indirect retry.

A user approval question is pending for exactly that local driver grant, including own-job reading and report/media submission rights, no external sharing and five-minute expiry. No answer has been received. This blocks real invitation/claim browser evidence only; synthetic adapter/render tests and all independent runtime work completed. Do not infer approval from elapsed time or from this report.

## Integration / remaining limits

Code is ready for Lead integration review. Record v2 progress toward09.01/09.02 and runtime portions09.04–09.06/09.08, while retaining full phase09/web-ready pending. The current baseline publishes13 working session operations,4mounted views that fail closed503 and49 unmounted404. This worker did not complete their backend implementations or claim full business E2E.

Lead must supply production Worker/static-assets same-origin SPA deep-link handling and fresh business composition receipt, then run real plan/report/media/reward/results/cross-client flows. No new dependency or shared public export is requested. Full Sources/Planner/Review/Results, real model/device/D04/security/release evidence and known advisory gates remain pending. No main/integration merge, push, deploy, account/key/resource/provider/paid/device action occurred. No out-of-scope source or secret was committed.

Input hashes SHA256:

- Unchanged bun.lock51e78190af81387909c19c65adfce6da02b8567778f70a26f78dcce98ee5c1ab.
- Vite live config8f8107d30d2e3cd6947f3246dd19ed56a1ffe5f85debb8d7eefe78d610f9ff7e.
- Local API config fbf091fb14346ba64f620393f9d385942234fdebc7bd0b635ebe802af134a598.
- Functional manifest3c14fcd1b67057028997e4d6ca8de6b9bafeaba710adee6b0448ec40e42cb66f.
- Fixture source773221d8400312db9cc1d1e4f100aa4e8ffe2beeab7444f3e8abd852208abf38.

## Structured SourceEvidence

```json
{
  "work_item_id": "web-console-runtime-continuation-v2",
  "role_id": "web-console",
  "base_sha": "223a58654210e934dfb1eda1092be33a7fdc30fe",
  "observed_launch_sha": "2364a58e271a738790fe2a70fd47f67ad0befb52",
  "status": "code-ready-for-integration",
  "contract_sha256": "bda263b1d21bfa26994d857da94f97b8974a3cfee08059e805e889f765202527",
  "changed_paths": [
    "apps/web/README.md",
    "apps/web/index.html",
    "apps/web/preview/fixtures.ts",
    "apps/web/preview/main.tsx",
    "apps/web/src/app/application.tsx",
    "apps/web/src/app/context.tsx",
    "apps/web/src/app/failure.ts",
    "apps/web/src/app/latest-plan.ts",
    "apps/web/src/app/main.tsx",
    "apps/web/src/app/plan-route.tsx",
    "apps/web/src/app/queries.ts",
    "apps/web/src/app/report-route.tsx",
    "apps/web/src/app/report-submit-route.tsx",
    "apps/web/src/app/runtime.ts",
    "apps/web/src/app/styles.css",
    "apps/web/src/app/workspaces.tsx",
    "apps/web/src/features/planning/plan-screen.tsx",
    "apps/web/src/features/reports/client.ts",
    "apps/web/src/features/reports/image-binding.ts",
    "apps/web/src/features/reports/report-form.tsx",
    "apps/web/src/features/reports/review-screen.tsx",
    "apps/web/src/features/session/runtime/commands.ts",
    "apps/web/src/features/session/runtime/foreground.ts",
    "apps/web/src/features/session/runtime/invitations.tsx",
    "apps/web/src/features/session/runtime/join-page.tsx",
    "apps/web/src/features/session/runtime/session-page.tsx",
    "apps/web/src/features/session/runtime/session-shell.tsx",
    "apps/web/src/router.tsx",
    "apps/web/src/shared/client-context.ts",
    "apps/web/test/client.test.ts",
    "apps/web/test/invitations.test.tsx",
    "apps/web/test/latest-plan.test.ts",
    "apps/web/test/router.test.tsx",
    "apps/web/test/runtime.test.ts",
    "apps/web/test/screens.test.tsx",
    "apps/web/test/tsconfig.json",
    "apps/web/vite.config.ts"
  ],
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/09-web-console",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun run --cwd apps/web typecheck",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/09-web-console",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/web/test/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/09-web-console",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun --bun run eslint apps/web/src apps/web/preview apps/web/test apps/web/vite.config.ts apps/web/vite.partial.config.ts --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/09-web-console",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun run --cwd apps/web test",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/09-web-console",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun run --cwd apps/web build",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/09-web-console",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "bun run --cwd apps/web build:partial",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/09-web-console",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "git diff --cached --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/09-web-console",
      "result": "pass",
      "evidence_path": null
    },
    {
      "command": "git verify-commit c0f5b30ae4147233a3d6a39173720b053b8a9c91",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/09-web-console",
      "result": "pass",
      "evidence_path": null
    }
  ],
  "smoke": [
    {
      "scenario": "Real browser create, identity, participants, events and Reset/reload via local API",
      "observed_result": "Create201; identity/participants/events/SSE200. Secure HttpOnly cookie retained; Reset201 switched generation0 to1; reload recovered identity from cookie. No client address/auth-header spoofing or insecure-cookie fallback.",
      "result": "pass",
      "evidence_path": null
    },
    {
      "scenario": "Real browser business-view failures and narrow viewport",
      "observed_result": "Snapshot503 CONFIG_INCOMPLETE and plans404 NOT_FOUND rendered explicit server errors with no fixture data. At320px scrollWidth320; screenshot emitted in task output.",
      "result": "pass",
      "evidence_path": null
    },
    {
      "scenario": "Real invitation creation and follow-on claim",
      "observed_result": "Automatic approval review denied creation of a5-minute driver drv_moto01 invitation in local synthetic session_dbf692e7b62d456fbc8f30556e441416 because recipient/access scope lacked explicit authorization. No invitation was created; claim was not attempted. User approval question remains pending. No workaround retry.",
      "result": "unavailable",
      "evidence_path": null
    }
  ],
  "public_exports": [
    "apps/web/src/router.tsx: createRoutes, createApplication",
    "apps/web/src/app/runtime.ts: WebRuntime; app/application.tsx: WebApplication",
    "apps/web/src/features/session/runtime/commands.ts: SessionCommands",
    "apps/web/src/features/session/runtime/foreground.ts: followSession",
    "Existing feature facade plus commandBlockedReason/reviewBlockedReason/normalizedImageReady and reportImageContext binding"
  ],
  "integration_requests": [
    "Lead-owned production Worker/static-assets SPA fallback/same-origin configuration. Local Vite proxy is implemented.",
    "Fresh backend business composition receipt, then real plan/report/media/reward/results/cross-client E2E; current4views503 and49unmounted404 are not concealed.",
    "Explicit user approval required before retrying the denied real local driver invitation; claim remains unexercised. No new package or shared-interface change requested."
  ],
  "blocked_prerequisites": [
    "Real invitation creation denied, known not executed; pending explicit recipient/access approval. Exact target local session_dbf692e7b62d456fbc8f30556e441416, driver drv_moto01,300seconds, self-controlled test client, no external sharing.",
    "Full Sources/Planner/Review/Results runtime composition and full backend/web acceptance remain unavailable at this launch.",
    "Real model/device/D04/security/release evidence unavailable; known upstream advisories are not waived."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "c0f5b30ae4147233a3d6a39173720b053b8a9c91",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```
