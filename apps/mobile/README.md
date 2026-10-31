# FloodOps native runtime

One Expo58/React Native0.88 app uses Expo Router and server-issued capabilities for driver, contributor and dispatcher workspaces. `app/_layout.tsx` mounts the native runtime, safe-area provider and a read-only TanStack query cache. No web renderer or alternate router is used.

## Actual routes and platform adapters

- `/`: real scenario discovery, explicit server-validated scenario creation, invitation claim and explicit secure rejoin. An unavailable catalog stays visible; a user can enter a known scenario ID/version without fixture fallback. Invitation codes stay in memory during the request and are never route parameters.
- `/sessions/[sessionId]`: capability-filtered workspace navigation. Dynamic workspace/report routes validate current session and permissions before privileged reads.
- Driver: own committed dashboard/orders/stops/route references/ETA. Contributor: own report states/reasons and server-recorded simulated points. Dispatcher: snapshot/map, selected plan closure/decisions/Execute, sources, timeline/clock/Reset, results, manual review and advisory AI card. API errors remain actual errors while business composition is unfinished.
- `src/shared/native/secure-store.ts` supplies the real SecureStore adapter with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. The serialized vault has no plaintext/memory credential fallback. It persists a validated native credential envelope before exposing identity; unavailable/corrupt/failed persistence closes access. Cancellation guards prevent an old join from restoring credentials after Leave.
- `src/features/reports/data/file-draft-store.ts` uses modern FileSystem async copy/write and immutable save files under principal/session/generation directories. Interrupted/corrupt newer saves preserve older valid captures. Loading another principal’s fields/media is denied synchronously. Same-owner old-session drafts require explicit review/relink/send; matching role/entity never grants ownership. A changed participant ID requires verified continuity that the canonical identity does not otherwise provide.
- `native-photo-port.ts` uses ImagePicker permission/selection and actual JPEG/PNG byte/size validation. Reserve → binary typed PUT → completion uses private IDs, never arbitrary upload URLs or FormData. Only a normalized server-ready media ID can enter a report. Picker `exif:false` does not itself prove metadata removal. Private normalized review images use authenticated `getMedia` and principal-scoped cache files.
- Foreground network/AppState controls cancel subscriptions/requests on background, identity change or Reset. Shared `watchEvents` consumes cursor-scoped SSE with a foreground polling fallback. Commands stay stale until authorized identity refresh after reconnect. Query keys include session/generation/principal; foreign cached views are removed. No operational mutation is registered, persisted or queued; there is no operational command outbox.

Session screens show Simulation, calibration and simulation time. Assignment/ETA/points remain server-derived. Approval does not Execute. A user selects independently eligible groups; dependency closure includes required groups and excludes blocked unrelated siblings. The server still recomputes combined safety/atomicity. Cached/refetching plan pointers cannot enable a superseded plan.

AI remains advisory. The local report input equality key covers photo/fixture, description, location, capture fields, vehicle scope and status; it is not a server digest or a new wire field. Input changes hide old advice immediately, including A→B→A transitions until a fresh ticket. Same-revision job events apply; unrelated global revision/event progress does not invalidate valid input-matched advice. Manual review remains independent of AI pending/failure.

## Local commands

Use supplied Bun1.4.0 frozen dependencies. Wrangler and Expo CLI use the repository-authorized Node runtime exception; the API still executes in real Workerd.

```sh
bun run --cwd apps/mobile typecheck
bun run --cwd apps/mobile test
bun --bun run eslint apps/mobile/src apps/mobile/app apps/mobile/preview apps/mobile/test apps/mobile/app.config.ts apps/mobile/metro.config.cjs --max-warnings=0
bun run --cwd apps/mobile start:local
bun run --cwd apps/mobile bundle:ios
bun run --cwd apps/mobile bundle:android
```

`EXPO_PUBLIC_FLOODOPS_API_BASE_URL` may contain only a non-secret HTTPS base URL or explicit loopback development URL. Default: `http://127.0.0.1:8790/api/v1`. No bearer/cookie/provider key belongs in public configuration, query, fragment or route parameters. Metro binds localhost8082; no LAN/tunnel or device mapping is created.

For the authorized local HTTP probes, start the supplied synthetic local API config under Node with `--local --ip 127.0.0.1 --port 8790` and isolated persistence, then run `bun apps/mobile/test/session-http-smoke.ts` and `bun apps/mobile/test/media-http-smoke.ts` separately. These exercise real Workerd HTTP using disclosed test-only SecurePorts; they do not exercise device Keychain. At exact M1 launch `c30dd59defde31e222e4a52416ad3e6f553d0bb0`, catalog/create/claim/configuration/graph, role denial and actual image reservation/binary upload/normalization succeed, but driver and citizen report submission return `422 INVALID_SCHEMA` while Source serializers migrate. Probes exit nonzero with the exact action and completed steps; missing review routes never count as M1 success. The earlier native-v3 report/own-read pass is historical and is not a current M1 E2E claim.

The separate `preview/` surfaces are prominently marked disconnected synthetic fixtures; production runtime does not import them. Unit/render tests mock platform hardware/filesystem only in `test/`. Native JS exports and a Metro launch prove bundling/serving, not installation, native hardware, VoiceOver/TalkBack, full cross-client business E2E or calibration. No prebuild, EAS, device, store, deploy, paid/provider/model, account/resource/key action is part of this continuation.

## Integration continuation

Lead owns central manifests/lock/EAS/API composition/plan/gates. Full Planner/Review/reward projections and final backend gates remain pending; stable source/media/report routes are now mounted. After their integrated receipts, run real mobile report→web review→mobile status/points and mobile Execute→web/driver flows on the actual backend. iOS/Android binary installation, hardware persistence/photo permissions, screen readers, approved device access and release/advisory gates require their own evidence and authorization.

## Fast Expo Go path (compatibility checked, not device-tested)

The app uses ExpoSDK58 (public config resolves58.0.0). All20 versioned native dependencies match the installed Expo bundled-native-module versions; no current native dependency requires a custom dev client. SecureStore has no biometric requireAuthentication option. SecureStore, modern FileSystem, ImagePicker and Reanimated are included in matching Expo Go. Sources: [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/), [ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/), [Reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/).

A phone must actually have Expo Go supporting SDK58. Each Expo Go build supports a matching SDK, so an arbitrary existing store installation is insufficient. Android users can select SDK58 at [the official Expo Go page](https://expo.dev/go). The [physical-iOS compatibility instructions](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/) impose additional distribution constraints for newer SDKs; do not assume the existing iPhone store app supports58. Physical iOS Expo Go additionally requires Expo CLI and Expo Go to use the same Expo account when opening a development server, per [the official sign-in guidance](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/). No account login, Expo Go, SDK or toolchain installation was performed here.

Verified local Go-targeted command, from apps/mobile:

```sh
EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 node node_modules/expo/bin/cli start --go --localhost --port 8082
```

API base remains http://127.0.0.1:8790/api/v1. On a physical phone,127.0.0.1 is the phone itself. The current localhost-only setup therefore needs separately authorized supported USB port mapping, or an approved phone-reachable Metro plus HTTPS API endpoint. Neither LAN/tunnel nor network permission was enabled; no device connection is claimed. Custom permission text, removed native permissions, custom app scheme/runtimeVersion and standalone behavior cannot be verified by Expo Go’s existing binary.

Fresh report defaults now derive captured_at from the authorized configuration T0 + simulation minute. Restored drafts keep their original capture metadata. A confirmed server report receipt survives its own revision refresh, shows ID/status/reason codes and disables duplicate Send until explicit Start new report. When an assignment/points projection is unavailable, field workspaces can still read actual own reports from the separate authorized endpoint; no assignment or points total is fabricated.

## M1 functional wire continuation

Reports display exact server reward status/reason, immutable receipt policy and manual-review identity. Missing policy stays pending_config with no award; accepted knowledge does not imply points. Only committed ledger entries supply award amounts. Manual Reject supports needs_clarification; Accept requires a pending report and explicitly confirmed nonunknown condition, independent of AI or reward configuration.

The dispatcher can explicitly Request new plan through current capability/CAS/idempotency guards. Planning jobs display deterministic algorithm/config/search limit and distinguish NO_FEASIBLE_PLAN from PLANNER_TIMEOUT. A newer same-revision job fences an older proposal; requesting/approving does not Execute. Photo AI job fields remain unchanged.

Strict M1 responses are consumed without local DTO upgrades. A malformed mutation response can follow a server commit and blocks subsequent commands until authoritative inspection/refresh. Legacy serialized data requires an explicit new session/Reset; private stored captures and credentials are not rewritten. Full manual-review/planner/assignment/reward backend composition remains Lead/producer-owned and must land before the probes can establish that path.
