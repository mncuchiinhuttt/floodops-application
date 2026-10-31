# WebConsole screen foundations

Authorized partial `web-console-screen-foundations-v1` at launch `c2216f9610cb7fb6a71279e4357a70896f86fa3c`. These are actual React feature screens/forms and typed client adapters. The separate fixture preview is disconnected and cannot serve as web-ready, API E2E, model or D04 evidence.

## Public app seams

- `src/features/index.ts`: `DriverWorkspace`, `ContributorWorkspace`, `ReportForm`, `ReviewScreen`, `PlanScreen`, `ImageReviewCard`, capability navigation definitions and report/planning client factories.
- `src/shared/client-context.ts`: `createBoundClient(ApiClient, readContext)` and `ClientContext`. The caller supplies server-issued `Identity`, current connectivity/time and a session/generation `RequestScope`. Use the shared client's `webCredentials` with an in-memory CSRF reader; no credential store is implemented here.
- `src/shared/feature-state.tsx`: `Resource<T>` explicitly distinguishes loading/error/stale/ready. No fixture fallback exists in feature code. Screens accept provenance supplied from authoritative scenario metadata; absent provenance remains explicitly unknown.
- Driver routes follow only IDs from `getOwnDriverDashboard`; ownership and response revision must still match that dashboard. `Route.status=candidate` does not establish commitment. Dashboard orders/stops and route snapshot details have separate labels, and null ETA remains waiting.
- Review callbacks receive canonical `ReviewInput`; AI requests are independent callbacks. `ImageBinding` must come from the current server report/job/digest and includes `reportInputRevision`. An enclosing report/session/input mismatch hides advice. A completed, consistent server score of zero remains zero; missing/error/stale advice has no score.
- `ImageReviewRefresh` is an injected event invalidation adapter. Supply only the authorized dispatcher stream, current binding, a GET loader and state callback. Higher event sequence triggers refresh even at equal operational revision. Reset/new binding discards old asynchronous output. Catch `onEvent()` loader failures and present an error plus explicit refetch; it does not queue retries. Stream connection/bootstrap remains continuation work.

Capability navigation is route data for the future React Router Data Mode integration; there is no alternate router. Permission/role checks improve presentation, while the API remains the authorization boundary. The adapter snapshots principal, session version and scope before preparing a command and rechecks them when sending. Offline operational commands are rejected, and 401/403/410/412 invalidate a prepared command. After a lost transport response, an explicit resend of the same still-valid prepared request retains its key; there is no automatic operational replay or optimistic route/points mutation.

The composer must update `readContext().now` from its clock, cancel the previous `RequestScope` on Reset/rejoin/principal changes, refresh authoritative data after success, retain API ETag/meta, and bind callbacks to the displayed report/plan. Pass the current scenario provenance and review job binding alongside resources. Report fields reset on a principal/session-generation change rather than silently relinking an old report. Native persistence/photo capture is outside this slice.

## Local verification

Use Bun 1.4.0 and the centrally supplied frozen lock:

```sh
bun install --frozen-lockfile --ignore-scripts
bun run --cwd apps/web typecheck
bun --bun run tsc --noEmit -p apps/web/test/tsconfig.json
bun --bun run eslint apps/web/src apps/web/preview apps/web/test apps/web/vite.partial.config.ts --max-warnings=0
bun run --cwd apps/web test
bun run --cwd apps/web build:partial
bun run --cwd apps/web dev:partial
```

The fixture preview binds `127.0.0.1:5174`. Its scene chooser and callbacks are labelled synthetic/disconnected. Fixture/schema data lives only in `preview/` and tests; feature source imports neither. The preview demonstrates driver/contributor reports, own data/zero-point status, plan decisions/Execute separation and AI pending/failed/completed states.

## Remaining integration

React Router Data Mode bootstrap, TanStack cache, real Worker routes/composition, authorized live event subscription, private normalized image fetch/display, media upload/photo selection, source/map/timeline/results surfaces and full backend-dependent flows require a fresh continuation receipt and integrated producer gates. No new registry dependencies are requested by this partial. Shared UI wrappers remain DesignSystem-owned; consumers use the pinned public exports.

No backend-ready/ui-libraries-ready/web-ready/full phase gate is claimed. Real model, device/native binary, D04 provenance/calibration, security/release acceptance and known upstream release blockers remain separate evidence requirements. No push, deploy, paid/model/account/device action is performed by this slice.
