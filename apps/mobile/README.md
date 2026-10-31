# FloodOps native screen foundations

This receipt-authorized partial slice contains actual React Native feature screens and forms. It does not provide the Expo Router application bootstrap or an installable binary. One future app uses server-issued capabilities to expose driver, contributor and dispatcher workspaces.

## Public feature surfaces

- `src/features/session/workspace-screen.tsx`: capability-filtered navigation descriptors through `onNavigate`, without a local role grant or alternate router.
- `src/features/driver/driver-screen.tsx`: own committed orders, stops, server route references, ETA and reports from `DriverDashboard`.
- `src/features/rewards/contributor-screen.tsx`: own report status/reasons and server-recorded simulated points/awards from `ContributorDashboard`.
- `src/features/reports/report-form.tsx`: driver text/quick reports and contributor photo metadata, manual location/capture fields, injected photo/draft/submission ports, explicit offline draft send/relink.
- `src/features/reports/review-screen.tsx`: manual typed review form plus a separate advisory AI card. Pending/failed/invalid/stale advice has no fabricated score; manual decisions remain independent.
- `src/features/planning/plan-screen.tsx`: projected diffs/evidence/rules/dependency groups and separate decision/Execute callbacks. Consumers must supply the current authoritative plan/job pointer; same-revision supersession disables the old plan.
- `src/features/operations-map/overview-screen.tsx`: scoped impact and proportional native SVG graph plus a text alternative using server lengths and vehicle-specific knowledge.
- `src/features/sources/sources-screen.tsx`, `results/results-screen.tsx`, `simulation/timeline-screen.tsx`: provenance/conflict/coverage, raw measured metrics and nullable rates, online clock/explicit Reset confirmation bound to session/generation/revision.

All screen frames show Simulation, calibration and simulation time. Shared UI/token/icon packages are consumed through their pinned public entrypoints. This slice does not change shared schemas, safety rules or UI primitives.

## Native host integration contract

1. Obtain a current authorized identity and session via the canonical shared API. Construct `MobileContext` with that participant, session, current injected wall-clock value, connection state and freshness. Refresh `nowMs`; never populate capability permissions from a persona selector. Server authorization remains authoritative.
2. Inject a real native `NativeCredentialPort` into `createNativeApi`. The deferred host supplies SecureStore; this slice has no substitute credential storage, credential URL, public environment token or in-memory credential fixture fallback.
3. Construct `NativeSessionClient` per refreshed context. It binds cancellation to session/generation, fixes permissions per explicit operation, uses C1 ETags/idempotency fields and never queues mutations. A revision mutation requires an authoritative refresh before another command. Invalidate the client on Reset/rejoin/revocation; recreate it from the next authorized snapshot. Preserve an attempted command's key for outcome inspection; never retry an uncertain command automatically.
4. Drive `initialQuery` / `reduceQuery` using the matching fetch ticket and authoritative session metadata. Older tickets, revisions, event sequences and generations cannot replace the current view. Reset clears authority and requires rejoin.
5. Drive `initialAdvice`, `beginAdvice`, `adviceEvent`, `receiveAdvice` from authorized current-report refetches. Job/digest bindings come from server responses, never event payload assumptions. `image_review_changed` at the same revision invalidates advice by event sequence. Manual report changes also clear it. A new server-authorized current job/input binding is supplied to `beginAdvice`; obsolete tickets and mismatched report/job/digest/generation results are discarded.
6. Pass typed callbacks to screens. Approval and failed Execute do not alter committed driver state. Replace that state only with the refreshed authoritative dashboard after successful Execute. `TimelineScreen.clockSession` must accompany the matching clock response.
7. Inject `PhotoPort` / `DraftPort` only when reviewed native adapters exist. A selected local image is not submitted or accepted. `PhotoPort.prepare` must perform the authorized upload/verification and return the server media ID. Missing/denied/cancelled ports preserve input and show unavailable; drafts retain capture metadata and require explicit review/relink after session changes. Only app-private reports/images may persist; there is no operational command outbox.

## Focused local verification

From this worktree root, with the already supplied Bun 1.4.0 frozen dependencies:

```sh
bun run --cwd apps/mobile typecheck
bun run --cwd apps/mobile test --watchman=false --modulePaths=./node_modules
bun apps/mobile/test/client-transport-smoke.ts
bun --bun run eslint apps/mobile/src apps/mobile/preview apps/mobile/test --max-warnings=0
```

The command-line overrides avoid this host’s unavailable Watchman socket and resolve the mobile-local Babel runtime for transformed workspace packages. Lead should integrate the module path into the central Jest configuration in a continuation; no central config is changed here.

Native render/interaction tests use the supplied Expo/Jest/RNTL preset and current matcher surface. The public-client smoke validates C1 requests/responses against a disclosed synthetic transport, including native credential injection and cancellation. These are focused code checks; they are not real backend E2E, device, screen-reader, model or calibration evidence.

`preview/native-fixture-preview.tsx` is a separate renderable fixture surface. Its prominent disconnected banner, synthetic provenance and disabled operational actions remain visible. Production feature modules do not import preview/test data.

## Continuation boundaries

A fresh receipt is required for Expo Router/app entrypoint, SecureStore, real photo/file persistence, foreground SSE/device wiring, Metro/runtime/deep links and binary builds. Full predecessor gates, backend composition, current UI continuation, iOS/Android installation, VoiceOver/TalkBack and cross-client flows remain pending. Existing dependency advisory/release blockers belong to the central owners. No remote build, prebuild, provider call, push, deployment or store action is authorized by this slice.
