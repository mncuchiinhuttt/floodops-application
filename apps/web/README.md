# FloodOps web runtime

`web-console-runtime-continuation-v2` adds the actual React Router Data Mode application. `index.html` loads `src/app/main.tsx`; `createApplication` creates an isolated runtime/router instance. The live application imports no preview/test fixture or credential fallback.

## Live app and API

Use Bun1.4.0 and frozen dependencies. In two terminals in this worktree:

```sh
node apps/api/node_modules/wrangler/bin/wrangler.js dev --config tooling/runtime/wrangler.client-demo.jsonc --local --ip 127.0.0.1 --port 8789 --persist-to apps/web/.wrangler/client-demo
bun run --cwd apps/web dev
```

Open `http://127.0.0.1:5174`. Vite proxies `/api/v1` to the isolated local API8789 without weakening cookies or injecting authentication/client-address headers. The committed demo config has public synthetic test keys and local bindings; never deploy it. The local synthetic scenario can be entered explicitly as `scn_functional1`, version `1`. This is a disclosed functional scenario, not D04 calibration evidence.

The current launch exposes13 working session/health/capability/event operations; snapshot/overview/own-driver/own-contributor views fail closed503 and49 remaining operations are unmounted404. Workspace routes show those actual errors with no fixture fallback or invented KPI. Full business composition and frontend business E2E remain gated.

## Runtime seams and behavior

- `src/router.tsx`: `createRoutes` / `createApplication`, typed role/permission loaders, create/claim/rejoin actions and lazy feature routes. Session IDs may appear in paths; capability, claim and CSRF tokens do not.
- `src/app/runtime.ts`: `WebRuntime`, in-memory identity/CSRF, session-generation `RequestScope`, isolated read-only `QueryClient`. Principal/entity/permission/generation changes abort old requests and clear private caches. The app writes no credentials to Web Storage and has no persisted/paused command queue; the server/browser manage the HttpOnly cookie.
- `src/features/session/runtime/commands.ts`: explicit session create/claim/invite/revoke/logout/Reset/delete. Admission body-loss retries are explicit and retain the original key/body. Commands do not automatically retry or rebase.401/403/410/412 invalidate prepared business commands;412 requires refresh/replan.
- Identity reads stay outside query caches. Forced post-command refresh obtains a read started after prior in-flight reads. Queued refreshes cannot restart after clear/Reset/dispose. Own lifecycle commands pause event readers and abort in-flight identity reads before sending; a late old-session410 cannot discard the replacement identity.
- Foreground `watchEvents` uses authorized identity metadata; background, offline, principal changes and terminal events cancel the subscription. Event sequence invalidates read resources even at equal operational revision. Reconnect is bounded by the shared client. No operational command is sent merely because connectivity returns.
- Driver/contributor reads use own endpoints, never the full dispatcher snapshot. Route details follow server-authorized dashboard route IDs/version. Canonical `Route.status` remains candidate/no_route; dashboard exposure establishes the binding, without inventing an executed route status. Null ETA remains waiting.
- Plan route verifies the current latest-plan/job snapshot before enabling commands. Refetch and stale/latest-pointer uncertainty disable commands. Approve/Reject, dry-run and Execute remain separate, with authoritative refetch after success and no optimistic assignment/points changes.
- Review uses server data, authenticated normalized-image GETs and current report/job/input bindings. AI needs a citizen photo, pending_review and confirmed normalized-image readiness. Accept and Reject have separate preconditions; Reject does not require valid mapping or AI success. Driver quick condition cannot be changed. Observable photo/caption/segment/capture/vehicle/status changes immediately hide old advice and reset confirmations. Refetch hides the score and temporarily blocks decisions while preserving fields.
- Invitation codes are masked local component state, outside read caches, URLs and logs. Only server-issued permissions expose invitations/dispatcher options. A new authority epoch remounts private forms. No invitation is sent to another person automatically.

`src/features/index.ts` retains the presentational screen/client facade. The separate `preview/` and `vite.partial.config.ts` remain explicitly fixture-only; `dev:partial` and `build:partial` are not live-app proof.

## Verification

```sh
bun install --frozen-lockfile --ignore-scripts
bun run --cwd apps/web typecheck
bun --bun run tsc --noEmit -p apps/web/test/tsconfig.json
bun --bun run eslint apps/web/src apps/web/preview apps/web/test apps/web/vite.config.ts apps/web/vite.partial.config.ts --max-warnings=0
bun run --cwd apps/web test
bun run --cwd apps/web build
bun run --cwd apps/web build:partial
```

Tests exercise the actual router/query/client libraries, render/forms, principal/cache cancellation, body-loss keys, forced-refresh races, late410/Reset and manual/AI separation with disclosed synthetic transports. They are not actual backend/model/device evidence.

Actual local browser checks verified create201, cookie identity200, open event stream200, Reset to a replacement generation, reload recovery, metadata/participants, 320px reflow, real503 workspace and404 plan error handling. Secure/HttpOnly cookie and CSRF/Origin guards were retained. Local Wrangler supplied the creation address; no client spoofing was added.

Real invitation creation was denied by automatic approval review pending explicit recipient/access authorization; invitation claim remains unexercised. No invitation was created by that denied action. Its adapter/render path is tested with synthetic transport only. A question requesting a five-minute local test-driver grant is pending; do not retry that action without new approval.

## Remaining integration

Lead owns production Worker/static asset composition, same-origin SPA deep-link serving, central dependency/config changes and full Sources/Planner/Review/Results integration. No new package is requested by this continuation. Once business ports are integrated under a fresh receipt, run real plan/report/media/reward/results and cross-client E2E against the candidate. Full web-ready, backend-ready,34US/POL/I acceptance, real model, native device, D04, security and release gates are not issued here.

No remote push/main merge/deploy/account/key/resource/paid/model/device action is authorized or performed by this slice.
